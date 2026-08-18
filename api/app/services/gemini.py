import asyncio
import itertools
import json
import logging
import os
import threading
import time

logger = logging.getLogger(__name__)

from google import genai
from google.genai import types
from google.oauth2 import service_account

from app.config import settings
from app.services import storage


_sa_lock = threading.Lock()
_sa_paths: list[str] = []
_sa_cycle: itertools.cycle = itertools.cycle([])
_sa_count: int = 0


def _init_sa_cycle() -> None:
    global _sa_paths, _sa_cycle, _sa_count
    candidates = settings.google_sa_json_paths or (
        [settings.google_sa_json_path] if settings.google_sa_json_path else []
    )
    paths = [p for p in candidates if p and os.path.isfile(p)]
    _sa_paths = paths
    _sa_cycle = itertools.cycle(paths) if paths else itertools.cycle([])
    _sa_count = len(paths)


_init_sa_cycle()


def reset_key_cycle(paths: list[str]) -> None:
    global _sa_paths, _sa_cycle, _sa_count
    with _sa_lock:
        _sa_paths = list(paths)
        _sa_cycle = itertools.cycle(_sa_paths) if _sa_paths else itertools.cycle([])
        _sa_count = len(_sa_paths)
    logger.info("SA key cycle reset: %d keys", len(paths))


def _next_sa_path() -> str | None:
    with _sa_lock:
        if _sa_count == 0:
            return None
        return next(_sa_cycle)

MARKETPLACE_STYLE = {
    "wb":   "Wildberries marketplace style: vibrant, noticeable and attention-grabbing, with a brighter and more emotional presentation, but still clean and not overloaded. Strong readability on mobile, large headline and clear benefits, bright yet neat visual accents.",
    "ozon": "Ozon marketplace style: clean, light, minimal and trustworthy. White or light background, neat composition, calm color palette, clear hierarchy, premium commercial presentation, minimal visual noise.",
    "ym":   "Yandex Market style: clean, rational, professional and slightly tech-oriented. Calm background, structured composition, trustworthy presentation, clear readable text, no aggressive decorative elements.",
}

TASK_TEMPLATE = {
    "photo":   "Professional marketplace product photography, commercial studio quality. Keep the uploaded product as the main subject and preserve it accurately: shape, color, material, proportions, packaging, logos and visible labels must remain unchanged. Clean composition, sharp focus, premium lighting, commercial look suitable for Ozon, Wildberries or Yandex Market. The result should look like a ready product visual, not a random stock image. No clutter, no distortion, no unnecessary objects, no watermarks.",
    "card":    "Create a selling marketplace product card / infographic. Use the uploaded product as the main and unchanged object: preserve shape, color, material, proportions, packaging, logos and visible labels. Build a clean commercial layout with strong visual hierarchy. The product must be large and clear. Text must be in Russian, short, large and readable. Use 3-5 short benefits maximum. Add neat icons if appropriate. The design should look modern, premium, clear and ready for a marketplace listing. Do not overload the card, do not use tiny text, do not add fake claims, do not add watermarks.",
    "video":   "Create a premium marketplace product video concept. Use the uploaded product as the main reference and keep it accurate and unchanged: preserve shape, color, material, proportions, packaging, logos and visible labels. The result should feel like a professional e-commerce advertising visual with dynamic composition, premium lighting and a clean commercial style. No distortion, no fake details, no clutter, no random text, no watermarks.",
    "improve": "Improve this marketplace product card image based on the user's request. Keep the product unchanged: preserve its shape, color, material, proportions, packaging, logos and visible labels. Keep the overall composition and the main commercial idea. You may refine only what the user asks for, such as background, light, shadows, secondary accents, visual cleanliness or placement of non-essential elements. Keep text readable and commercial quality high. Do not distort the product, do not rewrite the meaning, do not add fake claims, do not add watermarks.",
}

FALLBACK_PROMPT = "Marketplace product visual on a clean neutral background. Keep the product accurate and unchanged: preserve shape, color, material, proportions, packaging, logos and visible labels. Clean commercial composition, premium lighting, no clutter, no fake claims, no watermarks."

# Один вызов = товар (Image A) + один референс (Image B). Не батчить несколько
# референсов в один вызов — модель начинает смешивать их стили.
REFERENCE_CARD_PROMPT = (
    "You are an AI engine for creating marketplace product cards. "
    "Image A is the user's product photo. Image B is a single reference product card. "
    "Create one product card: the product from Image A, presented in the visual style of Image B. "
    "Preserve the product from Image A precisely: shape, silhouette, construction, proportions, materials, "
    "texture, key colors, hardware, prints, and the user's own logo if visible on the product. "
    "Do not replace the product, do not change its material, color, shape or proportions beyond recognition, "
    "do not invent details or characteristics that are not visible in Image A. "
    "From Image B you may adapt: composition, product placement and scale in frame, camera angle, card "
    "structure, background, color palette, lighting, decorative elements and infographic style. "
    "Do not copy from Image B one-to-one: the other product itself, its brand, logo, company name, watermarks "
    "or text. Create a new, original adaptation inspired by the reference, not a copy of it. "
    "If Image B contains a person, use them only as a reference for composition, scale and the way the product "
    "is demonstrated — do not copy their face, hairstyle, outfit or exact pose; if a person is needed in the "
    "result, create a new fictional person instead. "
    "The result must look professional, commercially clean, and ready to publish on a marketplace listing."
)


def _build_reference_prompt(product_name: str = "", wish: str = "", aspect_ratio: str | None = None) -> str:
    parts = [REFERENCE_CARD_PROMPT]
    if product_name:
        parts.append(f"Product name: {product_name}.")
    if wish:
        parts.append(f"User request: {wish}.")
    if aspect_ratio:
        parts.append(f"Output image aspect ratio: {aspect_ratio}.")
    return " ".join(parts)

CONCEPT_HINT = {
    # photo
    "model":     "Product shown on a human model in a realistic lifestyle presentation. Natural pose, clean commercial styling, the product remains the hero of the frame. Do not let the person overpower the product.",
    "shop":      "Product displayed in a realistic retail or store-shelf environment. Natural shop presentation, clean composition, realistic lighting, the product remains clearly visible and dominant.",
    "flatlay":   "Flat-lay composition shot from directly above, with a styled but clean arrangement. The product is the main focus, with neat supporting elements only if relevant.",
    "studio":    "Pure clean background, minimalist studio catalogue shot, plenty of air around the product, clean shadows, premium commercial catalog look.",
    # card
    "benefits":  "Infographic style with 3-5 short benefit points and neat icons. Benefits must be safe, universal and clearly readable in Russian. The product stays large and central.",
    "specs":     "Structured product card with a clean technical-specification feel. Use a clear layout and readable Russian text. Do not invent exact specifications if they are not confirmed or visible.",
    "lifestyle": "Marketplace card with the product placed in a realistic lifestyle scene, while still preserving readability and commercial clarity. Product remains the main focus, with fewer but clear text elements.",
    "premium":   "Dark premium marketplace card style with a luxury feel, deep or black background, high-end lighting, clean typography and strong product focus. Keep the result commercial, not overly artistic.",
    "minimal":   "Clean minimal white layout with lots of negative space, elegant typography, restrained accents and clear hierarchy. Product stays large, clean and prominent.",
    # video
    "rotation":  "товар медленно вращается вокруг вертикальной оси, движение плавное, чистое и премиальное, без искажения формы и упаковки",
    "reveal":    "товар появляется с эффектом reveal-анимации, плавно выходя из тени или света, с аккуратным коммерческим движением и акцентом на товар",
    "scene":     "короткий рекламный ролик товара в красивой стилизованной обстановке, с чистой композицией, мягким движением камеры и премиальной подачей",
}


def _get_client(sa_path: str | None = None) -> genai.Client:
    credentials = None
    project = settings.google_cloud_project
    if sa_path:
        with open(sa_path) as f:
            sa_info = json.load(f)
        credentials = service_account.Credentials.from_service_account_info(
            sa_info,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        project = sa_info.get("project_id") or project

    return genai.Client(
        vertexai=True,
        project=project,
        location=settings.google_cloud_location,
        credentials=credentials,
    )


def _build_prompt(
    task: str,
    marketplace: str,
    wish: str = "",
    concept_id: str = "",
    product_name: str = "",
    card_about: str = "",
    card_benefits: str = "",
    card_text: str = "",
    aspect_ratio: str | None = None,
) -> str:
    has_context = any([product_name, wish, concept_id, card_about, card_benefits, card_text])
    if not has_context:
        return FALLBACK_PROMPT

    base = TASK_TEMPLATE.get(task, TASK_TEMPLATE["photo"])
    style = MARKETPLACE_STYLE.get(marketplace, "marketplace product photo")
    parts = [f"{base}. {style}."]
    if product_name:
        parts.append(f"Product name: {product_name}.")
    if task == "card":
        if card_about:
            parts.append(f"Key message: {card_about}.")
        if card_benefits:
            parts.append(f"Benefits to highlight: {card_benefits}.")
        if card_text:
            parts.append(f"Text for the card: {card_text}.")
    if concept_id:
        hint = CONCEPT_HINT.get(concept_id)
        if hint:
            parts.append(f"{hint}.")
    if wish:
        parts.append(f"User request: {wish}.")
    if aspect_ratio:
        parts.append(f"Output image aspect ratio: {aspect_ratio}.")
    return " ".join(parts)


def _call_gemini(client, contents) -> bytes:
    response = client.models.generate_content(
        model=settings.google_gemini_model,
        contents=contents,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        ),
    )
    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            return part.inline_data.data
    raise RuntimeError("Gemini did not return an image")


def _generate_sync(
    task: str,
    marketplace: str,
    wish: str,
    image_bytes_list: list[bytes] | None = None,
    concept_id: str = "",
    product_name: str = "",
    card_about: str = "",
    card_benefits: str = "",
    card_text: str = "",
    image_mime_types: list[str] | None = None,
    aspect_ratio: str | None = None,
) -> str:
    sa_path = _next_sa_path()
    client = _get_client(sa_path)
    logger.info("Gemini request via SA: %s", sa_path or "ADC")
    prompt = _build_prompt(task, marketplace, wish, concept_id, product_name, card_about, card_benefits, card_text, aspect_ratio)

    mime_list = image_mime_types or []
    image_parts = [
        types.Part.from_bytes(data=b, mime_type=mime_list[i] if i < len(mime_list) else "image/jpeg")
        for i, b in enumerate(image_bytes_list or [])
    ]
    contents = (
        [*image_parts, types.Part.from_text(text=prompt)]
        if image_parts
        else prompt
    )

    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            image_out = _call_gemini(client, contents)
            break
        except Exception as e:
            last_exc = e
            if attempt == 0:
                logger.warning("Gemini attempt 1 failed (%s), retrying in 5s…", e)
                time.sleep(5)
    else:
        raise RuntimeError(f"Gemini failed after 2 attempts: {last_exc}") from last_exc

    return storage.upload_image(image_out, ext="jpg")


async def generate_image(
    task: str,
    marketplace: str,
    wish: str = "",
    image_bytes_list: list[bytes] | None = None,
    concept_id: str = "",
    product_name: str = "",
    card_about: str = "",
    card_benefits: str = "",
    card_text: str = "",
    image_mime_types: list[str] | None = None,
    aspect_ratio: str | None = None,
) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, _generate_sync,
        task, marketplace, wish, image_bytes_list, concept_id,
        product_name, card_about, card_benefits, card_text, image_mime_types, aspect_ratio,
    )
