const CLIENT_ID_STORAGE_KEY = 'era2_ym_client_id';
const YCLID_STORAGE_KEY = 'era2_yclid';
const METRIKA_BOOTSTRAP_TIMEOUT_MS = 4000;

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
  }
}

function normalizeTrackingValue(value: unknown, maxLength = 200): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function readLocalStorageValue(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return normalizeTrackingValue(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

function writeLocalStorageValue(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage write errors
  }
}

function readYandexUidCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )_ym_uid=([^;]*)/);
  if (!match) return null;
  try {
    return normalizeTrackingValue(decodeURIComponent(match[1]));
  } catch {
    return normalizeTrackingValue(match[1]);
  }
}

function getYandexMetrikaCounterId(): number | null {
  const rawValue = (process.env.NEXT_PUBLIC_YM_COUNTER_ID || '109477886').trim();
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function persistYclidFromLocation(): void {
  if (typeof window === 'undefined') return;
  const yclid = normalizeTrackingValue(new URLSearchParams(window.location.search).get('yclid'));
  if (yclid) writeLocalStorageValue(YCLID_STORAGE_KEY, yclid);
}

export function getStoredYclid(): string | null {
  return readLocalStorageValue(YCLID_STORAGE_KEY);
}

export async function getYandexMetrikaClientId(timeoutMs = 1500): Promise<string | null> {
  const cachedClientId = readLocalStorageValue(CLIENT_ID_STORAGE_KEY);
  const cookieClientId = readYandexUidCookie();
  const fallbackClientId = cachedClientId ?? cookieClientId;
  const counterId = getYandexMetrikaCounterId();
  const ym = typeof window === 'undefined' ? null : window.ym;

  if (cookieClientId && cookieClientId !== cachedClientId) {
    writeLocalStorageValue(CLIENT_ID_STORAGE_KEY, cookieClientId);
  }
  if (!counterId || typeof window === 'undefined' || typeof ym !== 'function') {
    return fallbackClientId;
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const timerId = window.setTimeout(() => finish(fallbackClientId), Math.max(250, timeoutMs));

    try {
      ym(counterId, 'getClientID', (clientId: unknown) => {
        window.clearTimeout(timerId);
        const normalized = normalizeTrackingValue(clientId);
        if (normalized) {
          writeLocalStorageValue(CLIENT_ID_STORAGE_KEY, normalized);
          finish(normalized);
          return;
        }
        finish(fallbackClientId);
      });
    } catch {
      window.clearTimeout(timerId);
      finish(fallbackClientId);
    }
  });
}

export async function getMetrikaCheckoutIdentifiers(): Promise<{
  metrika_client_id?: string;
  metrika_yclid?: string;
}> {
  persistYclidFromLocation();
  const metrikaClientId = await getYandexMetrikaClientId();
  const yclid = getStoredYclid();

  return {
    ...(metrikaClientId ? { metrika_client_id: metrikaClientId } : {}),
    ...(yclid ? { metrika_yclid: yclid } : {}),
  };
}
