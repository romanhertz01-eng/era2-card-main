import Image from 'next/image';
import { cn } from '@/lib/utils';

// ════════════════════════════════════════════════
// MOCKUP REGISTRY
// Все маркетплейс-визуалы в одном месте.
// Используются на лендинге, в studio, в модалках.
// ════════════════════════════════════════════════

interface MockupProps {
  className?: string;
}

// ─── Базовая «бутылочка косметики» ────────────
function CosmeticsBottle({ tint = '#E8F0E0' }: { tint?: string }) {
  return (
    <g>
      <rect x="42" y="26" width="16" height="6" rx="1.5" fill="#0A0A0F" />
      <path d="M40 32 L60 32 L62 50 L62 84 Q62 90 56 90 L44 90 Q38 90 38 84 L38 50 Z" fill={tint} stroke="#0A0A0F" strokeWidth="0.8" />
      <rect x="42" y="55" width="16" height="20" rx="2" fill="white" />
      <text x="50" y="64" textAnchor="middle" fontSize="3" fontWeight="700" fill="#0A0A0F" fontFamily="Inter, sans-serif">SERUM</text>
      <text x="50" y="69" textAnchor="middle" fontSize="2.2" fill="#6B7280" fontFamily="Inter, sans-serif">VITAMIN C</text>
      <line x1="44" y1="72" x2="56" y2="72" stroke="#C6F94D" strokeWidth="0.8" />
    </g>
  );
}

// ─── Базовые «наушники» ────────────
function Headphones() {
  return (
    <g>
      <path d="M30 50 Q30 25 50 25 Q70 25 70 50 L70 58 L64 58 L64 50 Q64 30 50 30 Q36 30 36 50 L36 58 L30 58 Z" fill="#0A0A0F" />
      <rect x="28" y="55" width="10" height="20" rx="3" fill="#0A0A0F" />
      <rect x="62" y="55" width="10" height="20" rx="3" fill="#0A0A0F" />
      <circle cx="33" cy="65" r="2" fill="#C6F94D" />
    </g>
  );
}

// ─── Базовая «кружка» ────────────
function Mug({ color = '#E8E0D8' }: { color?: string }) {
  return (
    <g>
      <ellipse cx="45" cy="40" rx="20" ry="4" fill="#0A0A0F" opacity="0.1" />
      <path d="M25 40 L25 75 Q25 85 35 85 L55 85 Q65 85 65 75 L65 40 Z" fill={color} stroke="#0A0A0F" strokeWidth="0.8" />
      <path d="M65 50 Q75 50 75 60 Q75 70 65 70" fill="none" stroke="#0A0A0F" strokeWidth="2" />
      <ellipse cx="45" cy="40" rx="20" ry="4" fill="white" stroke="#0A0A0F" strokeWidth="0.8" />
      <ellipse cx="45" cy="40" rx="16" ry="3" fill="#6B4F3A" />
    </g>
  );
}

// ─── Базовое «платье» ────────────
function Dress({ color = '#F4E8E0' }: { color?: string }) {
  return (
    <g>
      <path
        d="M40 25 L60 25 L62 35 L70 75 L65 88 L35 88 L30 75 L38 35 Z"
        fill={color}
        stroke="#0A0A0F"
        strokeWidth="0.8"
      />
      <circle cx="50" cy="25" r="3" fill="#0A0A0F" />
      <path d="M50 28 L50 60" stroke="#0A0A0F" strokeWidth="0.4" strokeDasharray="1,1" opacity="0.3" />
    </g>
  );
}

// ─── Базовая «гранола / еда» ────────────
function FoodPack({ color = '#FFE89C' }: { color?: string }) {
  return (
    <g>
      <rect x="28" y="25" width="44" height="58" rx="4" fill={color} stroke="#0A0A0F" strokeWidth="0.8" />
      <rect x="32" y="29" width="36" height="14" rx="2" fill="white" />
      <text x="50" y="38" textAnchor="middle" fontSize="3.5" fontWeight="800" fill="#0A0A0F" fontFamily="Inter, sans-serif">GRANOLA</text>
      <circle cx="42" cy="60" r="2" fill="#A06A3A" />
      <circle cx="50" cy="55" r="1.5" fill="#A06A3A" />
      <circle cx="58" cy="62" r="2.2" fill="#A06A3A" />
      <circle cx="46" cy="68" r="1.8" fill="#A06A3A" />
      <circle cx="54" cy="70" r="1.5" fill="#A06A3A" />
      <rect x="32" y="74" width="36" height="6" rx="1" fill="#0A0A0F" opacity="0.1" />
    </g>
  );
}

// ─── Базовый «конструктор» ────────────
function ToyBlock() {
  return (
    <g>
      <rect x="32" y="48" width="14" height="14" rx="1" fill="#FF6B6B" stroke="#0A0A0F" strokeWidth="0.6" />
      <rect x="48" y="42" width="14" height="20" rx="1" fill="#4ECDC4" stroke="#0A0A0F" strokeWidth="0.6" />
      <rect x="64" y="50" width="10" height="12" rx="1" fill="#FFE66D" stroke="#0A0A0F" strokeWidth="0.6" />
      <circle cx="39" cy="44" r="2" fill="#FF6B6B" stroke="#0A0A0F" strokeWidth="0.5" />
      <circle cx="39" cy="40" r="2" fill="#FF6B6B" stroke="#0A0A0F" strokeWidth="0.5" />
      <circle cx="55" cy="38" r="2" fill="#4ECDC4" stroke="#0A0A0F" strokeWidth="0.5" />
    </g>
  );
}

// ─── Базовая «лампа» ────────────
function Lamp() {
  return (
    <g>
      <path d="M50 25 Q35 25 32 45 L68 45 Q65 25 50 25 Z" fill="#FFE89C" stroke="#0A0A0F" strokeWidth="0.8" />
      <rect x="46" y="45" width="8" height="6" fill="#0A0A0F" />
      <path d="M44 51 L56 51 L54 60 L46 60 Z" fill="#C0C0C8" stroke="#0A0A0F" strokeWidth="0.5" />
      <ellipse cx="50" cy="35" rx="8" ry="3" fill="white" opacity="0.5" />
    </g>
  );
}

// ════════════════════════════════════════════════
// PRODUCT MOCKUPS
// ════════════════════════════════════════════════

const PRODUCT_MAP: Record<string, () => JSX.Element> = {
  'demo-cosmetics': () => <CosmeticsBottle />,
  'demo-electronics': () => <Headphones />,
  'demo-home': () => <Mug />,
  'ex-cosmetics-1': () => <CosmeticsBottle tint="#FFE0E8" />,
  'ex-cosmetics-2': () => <CosmeticsBottle tint="#E0F0FF" />,
  'ex-clothes-1': () => <Dress />,
  'ex-clothes-2': () => <Dress color="#2A2A35" />,
  'ex-electronics-1': () => <Headphones />,
  'ex-electronics-2': () => <Lamp />,
  'ex-home-1': () => <Mug />,
  'ex-home-2': () => <Mug color="#FFFFFF" />,
  'ex-kids-1': () => <ToyBlock />,
  'ex-kids-2': () => <FoodPack color="#B8E6FF" />,
  'ex-food-1': () => <FoodPack color="#6B4F3A" />,
  'ex-food-2': () => <FoodPack />,
  'result-1': () => <CosmeticsBottle tint="#FFE0E8" />,
  'result-2': () => <CosmeticsBottle tint="#E0F0FF" />,
  'result-3': () => <CosmeticsBottle tint="#F0FFE0" />,
  'result-4': () => <CosmeticsBottle tint="#FFF4E0" />,
};

function getProductSVG(id: string) {
  return PRODUCT_MAP[id] ?? PRODUCT_MAP['demo-cosmetics']!;
}

// ════════════════════════════════════════════════
// PUBLIC: ProductMockup — простое фото товара на фоне
// ════════════════════════════════════════════════

export function ProductMockup({
  mockId,
  className,
  bg = '#F7F7F8',
}: MockupProps & { mockId: string; bg?: string }) {
  const Product = getProductSVG(mockId);
  return (
    <div className={cn('relative aspect-square overflow-hidden rounded-2xl', className)}>
      <svg viewBox="0 0 100 100" className="h-full w-full" style={{ background: bg }}>
        <Product />
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════
// PUBLIC: BeforeAfter — два варианта (фон / без фона)
// ════════════════════════════════════════════════

export function BeforeMockup({ mockId, className }: MockupProps & { mockId: string }) {
  const Product = getProductSVG(mockId);
  return (
    <div className={cn('relative aspect-square overflow-hidden rounded-2xl', className)}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {/* Шумный фон «обычная фотка» */}
        <defs>
          <linearGradient id="bgNoisy" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#A0A0A8" />
            <stop offset="0.5" stopColor="#C8C0B8" />
            <stop offset="1" stopColor="#8A857F" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#bgNoisy)" />
        <rect x="0" y="0" width="100" height="3" fill="#6B7280" opacity="0.4" />
        <rect x="0" y="90" width="100" height="10" fill="#5A5550" opacity="0.6" />
        <Product />
      </svg>
    </div>
  );
}

export function AfterMockup({
  mockId,
  marketplace,
  className,
}: MockupProps & { mockId: string; marketplace?: 'wb' | 'ozon' | 'ym' }) {
  // Реальный URL от бека — показываем как изображение
  if (mockId.startsWith('http')) {
    return (
      <div className={cn('relative aspect-square overflow-hidden rounded-2xl bg-surface-2', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mockId} alt="result" className="h-full w-full object-contain" />
      </div>
    );
  }

  const Product = getProductSVG(mockId);
  const mpColor = marketplace === 'wb' ? '#CB11AB' : marketplace === 'ozon' ? '#005BFF' : '#FFCC00';
  const mpText = marketplace === 'ym' ? '#0A0A0F' : '#FFFFFF';
  const mpLabel = marketplace === 'wb' ? 'WB' : marketplace === 'ozon' ? 'Ozon' : 'ЯМ';

  return (
    <div className={cn('relative aspect-square overflow-hidden rounded-2xl', className)}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <defs>
          <linearGradient id="bgClean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#F0F0F2" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#bgClean)" />
        <ellipse cx="50" cy="92" rx="22" ry="2.5" fill="#0A0A0F" opacity="0.1" />
        <Product />
        {marketplace && (
          <g>
            <rect x="6" y="6" width="16" height="7" rx="2" fill={mpColor} />
            <text
              x="14"
              y="11.5"
              textAnchor="middle"
              fontSize="4"
              fontWeight="800"
              fill={mpText}
              fontFamily="Inter, sans-serif"
            >
              {mpLabel}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════
// PUBLIC: MarketplaceCard — карточка с инфографикой
// ════════════════════════════════════════════════

export function MarketplaceCard({
  mockId,
  marketplace = 'wb',
  variant = 'benefits',
  className,
}: MockupProps & {
  mockId: string;
  marketplace?: 'wb' | 'ozon' | 'ym';
  variant?: 'benefits' | 'lifestyle' | 'premium' | 'minimal';
}) {
  const Product = getProductSVG(mockId);
  const isDark = variant === 'premium';

  const bgColor = {
    benefits: '#FFE82E',
    lifestyle: '#F4EBE0',
    premium: '#0A0A0F',
    minimal: '#FFFFFF',
  }[variant];

  const textColor = isDark ? '#FFFFFF' : '#0A0A0F';
  const accent = isDark ? '#C6F94D' : '#0A0A0F';
  const mpColor = marketplace === 'wb' ? '#CB11AB' : marketplace === 'ozon' ? '#005BFF' : '#FFCC00';
  const mpLabel = marketplace === 'wb' ? 'WB' : marketplace === 'ozon' ? 'Ozon' : 'ЯМ';

  return (
    <div className={cn('relative aspect-[3/4] overflow-hidden rounded-2xl', className)}>
      <svg viewBox="0 0 90 120" className="h-full w-full">
        <rect width="90" height="120" fill={bgColor} />

        {/* MP бейдж */}
        <g>
          <rect x="4" y="4" width="14" height="6" rx="1.5" fill={mpColor} />
          <text
            x="11"
            y="8.5"
            textAnchor="middle"
            fontSize="3.5"
            fontWeight="800"
            fill={marketplace === 'ym' ? '#0A0A0F' : '#FFFFFF'}
            fontFamily="Inter, sans-serif"
          >
            {mpLabel}
          </text>
        </g>

        {/* Большой бейдж выгоды */}
        {variant === 'benefits' && (
          <g>
            <circle cx="76" cy="14" r="9" fill="#0A0A0F" />
            <text x="76" y="13" textAnchor="middle" fontSize="3" fontWeight="800" fill="#C6F94D" fontFamily="Inter, sans-serif">−40%</text>
            <text x="76" y="17.5" textAnchor="middle" fontSize="2" fill="white" fontFamily="Inter, sans-serif">скидка</text>
          </g>
        )}

        {/* Товар */}
        <g transform="translate(15, 22) scale(0.6)">
          <Product />
        </g>

        {/* Заголовок */}
        <text x="6" y="86" fontSize="5" fontWeight="800" fill={textColor} fontFamily="Inter, sans-serif">
          {variant === 'premium' ? 'PREMIUM LINE' : 'Премиум серия'}
        </text>
        <text x="6" y="92" fontSize="3" fill={isDark ? '#9CA3AF' : '#6B7280'} fontFamily="Inter, sans-serif">
          для ежедневного ухода
        </text>

        {/* Преимущества */}
        {variant === 'benefits' && (
          <>
            <rect x="4" y="97" width="38" height="8" rx="2" fill="#0A0A0F" />
            <text x="8" y="102.5" fontSize="2.6" fontWeight="700" fill="#C6F94D" fontFamily="Inter, sans-serif">✓ ВИТАМИН C 12%</text>
            <rect x="46" y="97" width="40" height="8" rx="2" fill="white" stroke="#0A0A0F" strokeWidth="0.5" />
            <text x="50" y="102.5" fontSize="2.6" fontWeight="700" fill="#0A0A0F" fontFamily="Inter, sans-serif">✓ ГИАЛУРОН</text>
            <rect x="4" y="108" width="82" height="8" rx="2" fill="#C6F94D" />
            <text x="45" y="113.5" textAnchor="middle" fontSize="2.6" fontWeight="800" fill="#0A0A0F" fontFamily="Inter, sans-serif">✓ ПОДХОДИТ ВСЕМ ТИПАМ КОЖИ</text>
          </>
        )}

        {variant === 'lifestyle' && (
          <>
            <text x="6" y="103" fontSize="2.5" fill="#6B7280" fontFamily="Inter, sans-serif">Создано для дома, где</text>
            <text x="6" y="107" fontSize="2.5" fill="#6B7280" fontFamily="Inter, sans-serif">приятно проводить время</text>
            <rect x="4" y="111" width="82" height="6" rx="1.5" fill={accent} />
            <text x="45" y="115" textAnchor="middle" fontSize="2.4" fontWeight="700" fill="white" fontFamily="Inter, sans-serif">ПОДРОБНЕЕ →</text>
          </>
        )}

        {variant === 'premium' && (
          <>
            <line x1="6" y1="96" x2="84" y2="96" stroke="#C6F94D" strokeWidth="0.3" />
            <text x="6" y="103" fontSize="2.4" fill="#9CA3AF" letterSpacing="0.1" fontFamily="Inter, sans-serif">СЕРИЯ NOIR · 2026</text>
            <rect x="4" y="108" width="82" height="8" rx="2" fill="#C6F94D" />
            <text x="45" y="113.5" textAnchor="middle" fontSize="2.6" fontWeight="800" fill="#0A0A0F" fontFamily="Inter, sans-serif">ОТКРЫТЬ КОЛЛЕКЦИЮ</text>
          </>
        )}

        {variant === 'minimal' && (
          <>
            <text x="6" y="103" fontSize="2.5" fill="#6B7280" fontFamily="Inter, sans-serif">100 ml · Made in EU</text>
            <line x1="6" y1="108" x2="84" y2="108" stroke="#0A0A0F" strokeWidth="0.3" />
            <text x="6" y="115" fontSize="3.5" fontWeight="700" fill="#0A0A0F" fontFamily="Inter, sans-serif">1 290 ₽</text>
            <text x="84" y="115" textAnchor="end" fontSize="2.5" fill="#6B7280" textDecoration="line-through" fontFamily="Inter, sans-serif">1 990 ₽</text>
          </>
        )}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════
// PUBLIC: TemplatePreview — превью шаблона
// ════════════════════════════════════════════════

export function TemplatePreview({
  mockId,
  className,
}: MockupProps & { mockId: string }) {
  const variants: Record<string, { variant: 'benefits' | 'lifestyle' | 'premium' | 'minimal'; mp: 'wb' | 'ozon' | 'ym' }> = {
    'tpl-minimal': { variant: 'minimal', mp: 'wb' },
    'tpl-benefits': { variant: 'benefits', mp: 'wb' },
    'tpl-premium': { variant: 'premium', mp: 'ozon' },
    'tpl-wb': { variant: 'benefits', mp: 'wb' },
    'tpl-ozon': { variant: 'minimal', mp: 'ozon' },
    'tpl-lifestyle': { variant: 'lifestyle', mp: 'ym' },
    'tpl-video': { variant: 'premium', mp: 'wb' },
  };

  const config = variants[mockId] ?? variants['tpl-minimal']!;
  return (
    <MarketplaceCard
      mockId="demo-cosmetics"
      variant={config.variant}
      marketplace={config.mp}
      className={className}
    />
  );
}

// ════════════════════════════════════════════════
// PUBLIC: HeroVisual — большой «перед/после» для hero
// ════════════════════════════════════════════════

export function HeroVisual({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {/* ERA2 aurora glow — pink/purple/orange/lime */}
      <div className="pointer-events-none absolute -inset-10 -z-10">
        <div className="absolute left-0 top-10 h-56 w-56 rounded-full bg-lime/30 blur-3xl" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-pink-400/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-purple-400/20 blur-3xl" />
        <div className="absolute right-1/4 bottom-10 h-48 w-48 rounded-full bg-orange-300/20 blur-3xl" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* BEFORE */}
        <div className="relative">
          <div className="absolute -top-3 left-3 z-10 rounded-full border border-line bg-surface px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-muted shadow-sm">
            До
          </div>
          <div className="relative aspect-square overflow-hidden rounded-2xl shadow-card">
            <Image
              src="/mockups/0-shapka-block/1-before.png"
              alt="Фото товара до обработки"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* AFTER */}
        <div className="relative">
          <div className="absolute -top-3 left-3 z-10 rounded-full bg-lime px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-ink shadow-lime-glow">
            После · WB
          </div>
          <div className="relative aspect-square overflow-hidden rounded-2xl shadow-card-hover">
            <Image
              src="/mockups/0-shapka-block/2-after-wb.png"
              alt="Карточка товара после обработки для Wildberries"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* Floating mini-cards */}
      <div className="pointer-events-none absolute -bottom-6 -left-4 hidden w-32 rotate-[-6deg] sm:block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-card-hover ring-4 ring-white">
          <Image
            src="/mockups/0-shapka-block/3-after-ozon.png"
            alt="Карточка товара для Ozon"
            fill
            className="object-contain"
          />
        </div>
      </div>
      <div className="pointer-events-none absolute -right-4 -top-6 hidden w-28 rotate-[8deg] sm:block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-card-hover ring-4 ring-white">
          <Image
            src="/mockups/0-shapka-block/4-after-ym.png"
            alt="Карточка товара для Яндекс Маркета"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// PUBLIC: CheckerboardBg — для прозрачности
// ════════════════════════════════════════════════

export function CheckerboardBg({ className }: { className?: string }) {
  return <div className={cn('checkerboard', className)} />;
}
