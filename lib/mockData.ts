import type {
  Audience,
  BalanceOperation,
  Concept,
  ContentType,
  ContentTypeInfo,
  CreditPack,
  DemoProduct,
  Era2Product,
  Example,
  FaqItem,
  Feature,
  GenerationResult,
  LoadingStep,
  Marketplace,
  MarketplaceInfo,
  MockUser,
  OnboardingStep,
  PricingPlan,
  Project,
  SavingItem,
  Template,
  Testimonial,
} from '@/types';

// ────────────────────────────────────────────────────────────
// USER
// ────────────────────────────────────────────────────────────

export const mockUser: MockUser = {
  id: 'usr_8a3f',
  name: 'Алексей Морозов',
  initials: 'АМ',
  email: 'a.morozov@brightgoods.ru',
  company: 'Bright Goods',
  tier: 'Креатор',
  joinedAt: '2025-11-04',
};

export const INITIAL_CHARGES = 48;

// ────────────────────────────────────────────────────────────
// MARKETPLACES
// ────────────────────────────────────────────────────────────

export const marketplaces: MarketplaceInfo[] = [
  { id: 'wb', name: 'Wildberries', short: 'WB', color: '#CB11AB' },
  { id: 'ozon', name: 'Ozon', short: 'Ozon', color: '#005BFF' },
  { id: 'ym', name: 'Яндекс Маркет', short: 'ЯМ', color: '#FFCC00' },
];

// ────────────────────────────────────────────────────────────
// GENERATOR
// ────────────────────────────────────────────────────────────

export const contentTypes: ContentTypeInfo[] = [
  {
    id: 'photo',
    name: 'Фото',
    description: 'Реалистичный образ товара',
    cost: 5,
  },
  {
    id: 'card',
    name: 'Карточка',
    description: 'Готовый слайд с текстом и преимуществами',
    cost: 5,
  },
  {
    id: 'video',
    name: 'Видео',
    description: 'Короткая видеообложка или ролик',
    cost: 12,
  },
];

export const conceptsPhoto: Concept[] = [
  {
    id: 'model',
    name: 'На модели',
    description: 'Одежда и аксессуары на человеке',
    preview: 'concept-model',
    type: 'photo',
  },
  {
    id: 'shop',
    name: 'Как в магазине',
    description: 'Натуральная подача на полке',
    preview: 'concept-shop',
    type: 'photo',
  },
  {
    id: 'flatlay',
    name: 'Раскладка сверху',
    description: 'Композиция flat-lay',
    preview: 'concept-flatlay',
    type: 'photo',
  },
  {
    id: 'studio',
    name: 'Студийный каталог',
    description: 'Чистый фон, минимализм',
    preview: 'concept-studio',
    type: 'photo',
  },
];

export const conceptsCard: Concept[] = [
  {
    id: 'benefits',
    name: 'С преимуществами',
    description: 'Иконки + краткие тезисы',
    preview: 'card-benefits',
    type: 'card',
  },
  {
    id: 'specs',
    name: 'Характеристики',
    description: 'Таблица параметров',
    preview: 'card-specs',
    type: 'card',
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: 'Товар в реальной сцене',
    preview: 'card-lifestyle',
    type: 'card',
  },
  {
    id: 'premium',
    name: 'Premium black',
    description: 'Тёмный, дорогой стиль',
    preview: 'card-premium',
    type: 'card',
  },
];

export const conceptsVideo: Concept[] = [
  {
    id: 'rotation',
    name: 'Вращение 360°',
    description: 'Товар крутится вокруг оси',
    preview: 'video-rotation',
    type: 'video',
  },
  {
    id: 'reveal',
    name: 'Reveal-анимация',
    description: 'Появление с эффектом',
    preview: 'video-reveal',
    type: 'video',
  },
  {
    id: 'scene',
    name: 'Сцена с товаром',
    description: 'Короткий ролик в окружении',
    preview: 'video-scene',
    type: 'video',
  },
];

export const productCategories = [
  'Косметика',
  'Одежда',
  'Обувь',
  'Электроника',
  'Товары для дома',
  'Детские товары',
  'Еда и напитки',
  'Ювелирные украшения',
  'Спорт',
  'Авто',
  'Зоотовары',
  'Другое',
];

export const demoProducts: DemoProduct[] = [
  { id: 'demo-1', name: 'Сыворотка для лица', category: 'Косметика', mockId: 'demo-cosmetics' },
  { id: 'demo-2', name: 'Беспроводные наушники', category: 'Электроника', mockId: 'demo-electronics' },
  { id: 'demo-3', name: 'Керамическая кружка', category: 'Товары для дома', mockId: 'demo-home' },
];

export const loadingSteps: LoadingStep[] = [
  { id: 's1', text: 'ИИ анализирует товар', duration: 1200 },
  { id: 's2', text: 'Удаляем фон', duration: 1100 },
  { id: 's3', text: 'Создаём композицию', duration: 1300 },
  { id: 's4', text: 'Добавляем преимущества', duration: 1200 },
  { id: 's5', text: 'Готовим карточку для маркетплейса', duration: 900 },
];

export const aiIdeas = [
  'Добавь мягкую тень, поставь товар на фоне светлого мрамора',
  'Сделай яркую wb-инфографику с подчёркнутыми преимуществами',
  'Натуральный lifestyle: товар на деревянном столе у окна',
  'Premium black: тёмный градиент, золотой блик, минимум текста',
  'Студийный белый фон с лёгкой подсветкой снизу',
];

/** Быстрые prompt chips — добавляются к полю «Пожелания» одним кликом */
export const promptChips: string[] = [
  'Сделать дороже',
  'Для Wildberries',
  'Для Ozon',
  'На белом фоне',
  'Добавить преимущества',
  'Премиальный стиль',
  'Больше воздуха',
  'Сделать ярче',
];

// ────────────────────────────────────────────────────────────
// LANDING — features
// ────────────────────────────────────────────────────────────

export const features: Feature[] = [
  {
    id: 'bg-remove',
    icon: 'Scissors',
    title: 'Удаление фона',
    description: 'Точно вырезаем товар, оставляем чистый PNG для любых композиций.',
  },
  {
    id: 'bg-gen',
    icon: 'Wand2',
    title: 'Генерация фона',
    description: 'Создаём подходящий фон под концепцию: студия, интерьер, природа.',
  },
  {
    id: 'infographic',
    icon: 'LayoutGrid',
    title: 'Инфографика преимуществ',
    description: 'Превращаем характеристики в графические плашки, понятные за 2 секунды.',
  },
  {
    id: 'lifestyle',
    icon: 'Sparkles',
    title: 'Lifestyle-фото',
    description: 'Товар в реальной сцене — еда на столе, косметика в ванной, техника в офисе.',
  },
  {
    id: 'mp-formats',
    icon: 'Store',
    title: 'Под Ozon, WB, ЯМ',
    description: 'Готовые размеры и пропорции под каждый маркетплейс — без ручной подгонки.',
  },
  {
    id: 'video',
    icon: 'PlayCircle',
    title: 'Видео-обложки',
    description: 'Короткие ролики из одной фотографии — выделяйтесь в выдаче.',
    badge: 'NEW',
  },
  {
    id: 'batch',
    icon: 'Layers',
    title: 'Массовая генерация',
    description: 'Загрузите 20 товаров — получите 20 карточек в едином стиле.',
  },
  {
    id: 'templates',
    icon: 'BookMarked',
    title: 'Шаблоны по категориям',
    description: 'Готовые сценарии для косметики, одежды, электроники, еды и других ниш.',
  },
];

// ────────────────────────────────────────────────────────────
// LANDING — examples
// ────────────────────────────────────────────────────────────

export const examples: Example[] = [
  // Косметика
  { id: 'ex1', category: 'cosmetics', productName: 'Сыворотка с витамином C', mockId: 'ex-cosmetics-1', marketplace: 'wb', resultType: 'card' },
  { id: 'ex2', category: 'cosmetics', productName: 'Крем для рук', mockId: 'ex-cosmetics-2', marketplace: 'ozon', resultType: 'lifestyle' },
  { id: 'ex3', category: 'cosmetics', productName: 'Масло для лица', mockId: 'ex-cosmetics-1', marketplace: 'ym', resultType: 'before_after' },
  // Одежда
  { id: 'ex4', category: 'clothes', productName: 'Льняное платье', mockId: 'ex-clothes-1', marketplace: 'wb', resultType: 'lifestyle' },
  { id: 'ex5', category: 'clothes', productName: 'Худи oversize', mockId: 'ex-clothes-2', marketplace: 'ozon', resultType: 'card' },
  { id: 'ex6', category: 'clothes', productName: 'Спортивный костюм', mockId: 'ex-clothes-1', marketplace: 'wb', resultType: 'video_cover' },
  // Обувь
  { id: 'ex7', category: 'shoes', productName: 'Кроссовки белые', mockId: 'ex-clothes-2', marketplace: 'wb', resultType: 'card' },
  { id: 'ex8', category: 'shoes', productName: 'Ботинки осенние', mockId: 'ex-home-1', marketplace: 'ozon', resultType: 'lifestyle' },
  { id: 'ex9', category: 'shoes', productName: 'Угги детские', mockId: 'ex-kids-1', marketplace: 'wb', resultType: 'before_after' },
  // Аксессуары
  { id: 'ex10', category: 'accessories', productName: 'Сумка кожаная', mockId: 'ex-home-2', marketplace: 'wb', resultType: 'card' },
  { id: 'ex11', category: 'accessories', productName: 'Кошелёк винтаж', mockId: 'ex-home-1', marketplace: 'ym', resultType: 'lifestyle' },
  { id: 'ex12', category: 'accessories', productName: 'Часы кварцевые', mockId: 'ex-electronics-1', marketplace: 'ozon', resultType: 'video_cover' },
  // Электроника
  { id: 'ex13', category: 'electronics', productName: 'Беспроводные наушники', mockId: 'ex-electronics-1', marketplace: 'ozon', resultType: 'card' },
  { id: 'ex14', category: 'electronics', productName: 'Умная лампа', mockId: 'ex-electronics-2', marketplace: 'ym', resultType: 'before_after' },
  { id: 'ex15', category: 'electronics', productName: 'Power bank 20000mAh', mockId: 'ex-electronics-1', marketplace: 'wb', resultType: 'video_cover' },
  // Дом
  { id: 'ex16', category: 'home', productName: 'Керамический чайник', mockId: 'ex-home-1', marketplace: 'wb', resultType: 'lifestyle' },
  { id: 'ex17', category: 'home', productName: 'Постельное бельё', mockId: 'ex-home-2', marketplace: 'ozon', resultType: 'card' },
  { id: 'ex18', category: 'home', productName: 'Свеча ароматическая', mockId: 'ex-cosmetics-1', marketplace: 'ym', resultType: 'lifestyle' },
  // Детское
  { id: 'ex19', category: 'kids', productName: 'Деревянный конструктор', mockId: 'ex-kids-1', marketplace: 'wb', resultType: 'card' },
  { id: 'ex20', category: 'kids', productName: 'Бутылочка для воды', mockId: 'ex-kids-2', marketplace: 'ym', resultType: 'before_after' },
  { id: 'ex21', category: 'kids', productName: 'Развивающий коврик', mockId: 'ex-kids-1', marketplace: 'ozon', resultType: 'lifestyle' },
  // Еда
  { id: 'ex22', category: 'food', productName: 'Кофе в зёрнах', mockId: 'ex-food-1', marketplace: 'ozon', resultType: 'card' },
  { id: 'ex23', category: 'food', productName: 'Гранола премиум', mockId: 'ex-food-2', marketplace: 'wb', resultType: 'lifestyle' },
  { id: 'ex24', category: 'food', productName: 'Чай улун листовой', mockId: 'ex-food-1', marketplace: 'ym', resultType: 'video_cover' },
];

export const exampleCategories: Array<{ id: Example['category']; label: string }> = [
  { id: 'cosmetics', label: 'Косметика' },
  { id: 'clothes', label: 'Одежда' },
  { id: 'shoes', label: 'Обувь' },
  { id: 'accessories', label: 'Аксессуары' },
  { id: 'electronics', label: 'Электроника' },
  { id: 'home', label: 'Дом' },
  { id: 'kids', label: 'Детям' },
  { id: 'food', label: 'Еда' },
];

// ────────────────────────────────────────────────────────────
// LANDING — что можно создать (7 типов карточек)
// ────────────────────────────────────────────────────────────

export interface CreatableType {
  id: string;
  title: string;
  description: string;
  mockId: string;
  badge?: string;
  costRange: string;
}

export const creatableTypes: CreatableType[] = [
  {
    id: 'title-card',
    title: 'Титульная карточка',
    description: 'Главное фото товара с акцентом — то, что покупатель видит первым в выдаче.',
    mockId: 'ex-cosmetics-1',
    costRange: '4 ⚡',
  },
  {
    id: 'infographic',
    title: 'Инфографика преимуществ',
    description: 'Слайд с тезисами, иконками и плашками. Идеально для второго фото в карточке.',
    mockId: 'ex-electronics-1',
    badge: 'хит',
    costRange: '4 ⚡',
  },
  {
    id: 'on-model',
    title: 'Фото на модели',
    description: 'Одежда, обувь, аксессуары — товар на живом человеке без съёмки и моделей.',
    mockId: 'ex-clothes-1',
    costRange: '3 ⚡',
  },
  {
    id: 'catalog',
    title: 'Каталожное фото',
    description: 'Чистый студийный фон, ровный свет. Подходит для всех маркетплейсов.',
    mockId: 'ex-home-2',
    costRange: '3 ⚡',
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle-сцена',
    description: 'Товар в естественной обстановке использования — кухня, ванная, рабочее место.',
    mockId: 'ex-home-1',
    costRange: '3 ⚡',
  },
  {
    id: 'video-cover',
    title: 'Видеообложка',
    description: 'Короткий ролик-обложка для карточки. Поднимает CTR в выдаче в 2-3 раза.',
    mockId: 'ex-cosmetics-2',
    badge: 'NEW',
    costRange: '12 ⚡',
  },
  {
    id: 'slides-series',
    title: 'Серия слайдов',
    description: '4-7 слайдов для одного товара: титул, преимущества, lifestyle, отзывы, гарантия.',
    mockId: 'ex-food-1',
    costRange: 'от 16 ⚡',
  },
];

// ────────────────────────────────────────────────────────────
// STUDIO — быстрые сценарии (presets для одного клика)
// ────────────────────────────────────────────────────────────

export interface QuickScenario {
  id: string;
  title: string;
  contentType: ContentType;
  marketplace?: Marketplace;
  conceptId: string;
  hint: string;
}

export const quickScenarios: QuickScenario[] = [
  {
    id: 's-card-wb',
    title: 'Карточка для WB',
    contentType: 'card',
    marketplace: 'wb',
    conceptId: 'benefits',
    hint: 'Яркая, с преимуществами, под пропорции Wildberries',
  },
  {
    id: 's-card-ozon',
    title: 'Карточка для Ozon',
    contentType: 'card',
    marketplace: 'ozon',
    conceptId: 'minimal',
    hint: 'Чистая, светлая, под визуальный код Ozon',
  },
  {
    id: 's-title',
    title: 'Титульный слайд',
    contentType: 'card',
    conceptId: 'minimal',
    hint: 'Главное фото товара для первого слайда',
  },
  {
    id: 's-info',
    title: 'Инфографика',
    contentType: 'card',
    conceptId: 'benefits',
    hint: 'С тезисами, иконками, преимуществами',
  },
  {
    id: 's-model',
    title: 'Фото на модели',
    contentType: 'photo',
    conceptId: 'lifestyle',
    hint: 'Одежда, обувь, аксессуары на живом человеке',
  },
  {
    id: 's-video',
    title: 'Видеообложка',
    contentType: 'video',
    conceptId: 'rotation',
    hint: 'Короткий ролик для главного фото карточки',
  },
];

// ────────────────────────────────────────────────────────────
// LANDING — templates
// ────────────────────────────────────────────────────────────

export const templates: Template[] = [
  { id: 't1', name: 'Минималистичная карточка',  category: 'Минимализм', mockId: 'tpl-minimal',    contentType: 'photo', conceptId: 'studio' },
  { id: 't2', name: 'Карточка с преимуществами', category: 'Инфографика', mockId: 'tpl-benefits',  contentType: 'card',  conceptId: 'benefits' },
  { id: 't3', name: 'Premium black',              category: 'Премиум',    mockId: 'tpl-premium',   contentType: 'card',  conceptId: 'premium' },
  { id: 't4', name: 'Яркая WB-инфографика',       category: 'WB',         mockId: 'tpl-wb',        contentType: 'card',  conceptId: 'specs',   wish: 'яркие цвета, WB-стиль, крупные иконки' },
  { id: 't5', name: 'Ozon clean',                 category: 'Ozon',       mockId: 'tpl-ozon',      contentType: 'photo', conceptId: 'studio',  wish: 'чистый минималистичный фон, стиль Ozon' },
  { id: 't6', name: 'Lifestyle интерьер',         category: 'Lifestyle',  mockId: 'tpl-lifestyle', contentType: 'photo', conceptId: 'shop',    wish: 'интерьерная lifestyle-съёмка' },
  { id: 't7', name: 'Видео-обложка',              category: 'Видео',      mockId: 'tpl-video',     contentType: 'video', conceptId: 'rotation' },
];

// ────────────────────────────────────────────────────────────
// LANDING — audiences + savings
// ────────────────────────────────────────────────────────────

export const audiences: Audience[] = [
  {
    id: 'sellers',
    icon: 'Store',
    title: 'Селлеры WB / Ozon / Яндекс Маркета',
    pain: 'Карточки конкурентов выглядят сильнее',
    benefit: 'Получаете премиум-визуал на уровне топовых брендов',
  },
  {
    id: 'producers',
    icon: 'Package',
    title: 'Производители',
    pain: 'Долго и дорого согласовывать визуал с дизайнером',
    benefit: 'Создаёте всю линейку в едином стиле сами, за вечер',
  },
  {
    id: 'marketers',
    icon: 'TrendingUp',
    title: 'Маркетологи маркетплейсов',
    pain: 'Нужно быстро тестировать гипотезы и креативы',
    benefit: 'Десять вариантов карточки за час, а не за неделю',
  },
  {
    id: 'small-biz',
    icon: 'Briefcase',
    title: 'Малый бизнес',
    pain: 'Нет бюджета на студию и постоянного дизайнера',
    benefit: 'Платите за результат, а не за время — от 390 ₽',
  },
  {
    id: 'agencies',
    icon: 'Users',
    title: 'Агентства',
    pain: 'Сложно масштабироваться без раздувания штата',
    benefit: 'Обрабатываете в 5 раз больше клиентов с той же командой',
  },
];

export const savings: SavingItem[] = [
  { id: 's1', title: 'Без дизайнера', description: 'Не нужно искать, согласовывать ТЗ и ждать правок' },
  { id: 's2', title: 'Без студии', description: 'Не платите за фотосессию, ретушь и реквизит' },
  { id: 's3', title: 'Без долгих ТЗ', description: 'Описали в одном предложении — получили результат' },
  { id: 's4', title: 'Без ручной инфографики', description: 'Преимущества собираются автоматически' },
  { id: 's5', title: 'Результат за 60 секунд', description: 'Не через 3 дня и не на следующей неделе' },
  { id: 's6', title: 'Дешевле в 10–15 раз', description: 'От 30 ₽ за изображение vs 500–1500 ₽ у дизайнера' },
];

// ────────────────────────────────────────────────────────────
// LANDING — pricing
// ────────────────────────────────────────────────────────────

export const pricingPlans: PricingPlan[] = [
  {
    id: 'start',
    name: 'Старт',
    description: 'Для пробы и первых карточек',
    price: 390,
    priceFormatted: '390 ₽',
    charges: 50,
    perks: ['10 изображений или 3 видео', 'Все инструменты доступны', 'Без привязки карты'],
  },
  {
    id: 'creator',
    name: 'Креатор',
    description: 'Для регулярных карточек',
    price: 990,
    priceFormatted: '990 ₽',
    charges: 150,
    perks: ['35 изображений или 8 видео', 'Шаблоны категорий', 'Сохранение проектов'],
  },
  {
    id: 'studio',
    name: 'Студия',
    description: 'Оптимальный выбор',
    price: 2490,
    priceFormatted: '2 490 ₽',
    charges: 450,
    perks: ['100 изображений или 25 видео', 'Массовая генерация', 'Приоритет в очереди', 'История версий'],
    popular: true,
  },
  {
    id: 'business',
    name: 'Бизнес',
    description: 'Команды и большие объёмы',
    price: 6490,
    priceFormatted: '6 490 ₽',
    charges: 1300,
    perks: ['300 изображений или 75 видео', 'Командный доступ', 'API доступ', 'Персональный менеджер'],
  },
];

// ────────────────────────────────────────────────────────────
// LANDING — testimonials
// ────────────────────────────────────────────────────────────

export const testimonials: Testimonial[] = [
  {
    id: 'tm1',
    name: 'Дарья Соколова',
    role: 'Селлер косметики, WB',
    initials: 'ДС',
    marketplace: 'wb',
    text: 'Раньше платила дизайнеру 1200 ₽ за карточку и ждала 2 дня. Теперь сама делаю за минуту. За месяц обновила все 64 позиции — в эту цену даже не верится.',
  },
  {
    id: 'tm2',
    name: 'Виктор Лебедев',
    role: 'Товары для дома, Ozon',
    initials: 'ВЛ',
    marketplace: 'ozon',
    text: 'Тестировали 4 разные обложки на одной карточке. AI собрал варианты быстро, мы откатали A/B — CTR в выдаче поднялся примерно на треть. Это окупает подписку за один день.',
  },
  {
    id: 'tm3',
    name: 'Анна Кириллова',
    role: 'Маркетолог бренда детских товаров',
    initials: 'АК',
    marketplace: 'wb',
    text: 'Что меня зацепило — единый стиль на всю линейку. Раньше карточки были разнобойные, теперь смотрятся как один бренд. Команда сократила время на креативы примерно вдвое.',
  },
  {
    id: 'tm4',
    name: 'Игорь Петрович',
    role: 'Магазин электроники, ЯМ',
    initials: 'ИП',
    marketplace: 'ym',
    text: 'Я не дизайнер вообще, путаюсь в фотошопе. Тут просто загрузил телефоны и написал, что важно. Карточки получились лучше, чем заказывал у фрилансера за 800 ₽ штука.',
  },
];

// ────────────────────────────────────────────────────────────
// LANDING — FAQ
// ────────────────────────────────────────────────────────────

export const faqItems: FaqItem[] = [
  {
    id: 'f1',
    question: 'Подходит ли для Wildberries, Ozon и Яндекс Маркета?',
    answer:
      'Да. ERA2 Card работает с пропорциями и требованиями каждого маркетплейса: фото 3:4 и 1:1, карточки 900×1200 и 1080×1080, видеообложки до 30 секунд. Результат сразу можно загружать в карточку товара.',
  },
  {
    id: 'f2',
    question: 'Нужен ли дизайнер или навыки работы с фоторедакторами?',
    answer:
      'Нет. Загружаете фото, выбираете формат (фото / карточка / видео) и пару кликов по концепции — всё остальное собирает ERA2 Card.',
  },
  {
    id: 'f3',
    question: 'Можно ли попробовать бесплатно?',
    answer:
      'Да. После онбординга на счёт зачисляется 15 ⚡ — этого хватит примерно на 3 фото или одну карточку с улучшениями. Карту привязывать не нужно.',
  },
  {
    id: 'f4',
    question: 'Сколько зарядов уходит на одну генерацию?',
    answer:
      'Фото — 5 ⚡, карточка — 5 ⚡, видео — от 20 ⚡ (зависит от качества и длины). За один прогон получаете 4 варианта. Улучшение готового результата — 3 ⚡.',
  },
  {
    id: 'f5',
    question: 'Можно ли редактировать результат после генерации?',
    answer:
      'Да. У каждой карточки есть поле «Улучшения» — вписываете правки текстом («сделай фон светлее», «добавь блик», «убери текст слева»), и появляется новая версия. Все версии сохраняются — V0, V1, V2 — можно вернуться к любой.',
  },
  {
    id: 'f6',
    question: 'Какие форматы доступны?',
    answer:
      'Три: реалистичное фото товара (для каталога), карточка со слайдом-инфографикой (для главного фото в карточке маркетплейса) и короткая видеообложка (для Reels и видео в выдаче). Все три — в одном интерфейсе.',
  },
  {
    id: 'f7',
    question: 'Что делать, если результат не понравился?',
    answer:
      'Можно сразу запустить новую генерацию или изменить концепцию слева. Заряды не возвращаются автоматически, но если все 4 варианта вышли непригодными — напишите в поддержку в течение суток, вернём.',
  },
  {
    id: 'f8',
    question: 'Можно ли использовать результаты в коммерческих целях?',
    answer:
      'Да. Всё, что генерирует ERA2 Card, можно использовать в коммерции без ограничений — на маркетплейсах, в рекламе, на сайте, в соцсетях. Права на результат остаются у вас.',
  },
];

// ────────────────────────────────────────────────────────────
// FOOTER — ERA2 ecosystem
// ────────────────────────────────────────────────────────────

export const era2Products: Era2Product[] = [
  {
    id: 'voice',
    name: 'ERA2 Voice',
    url: 'https://voice.era2.ai',
    description: 'Озвучка текста нейросетью',
    status: 'live',
  },
  {
    id: 'music',
    name: 'ERA2 Music',
    url: 'https://music.era2.ai',
    description: 'Генерация музыки и вокала',
    status: 'live',
  },
  {
    id: 'video',
    name: 'ERA2 Video',
    url: 'https://era2.ai',
    description: 'Генерация видео по тексту',
    status: 'soon',
  },
  {
    id: 'hub',
    name: 'ERA2 Hub',
    url: 'https://era2.ai',
    description: 'Главный агрегатор экосистемы',
    status: 'soon',
  },
];

// ────────────────────────────────────────────────────────────
// PROJECTS (mock)
// ────────────────────────────────────────────────────────────

export const mockProjects: Project[] = [
  {
    id: 'pr1',
    name: 'Косметика весна 26',
    category: 'Косметика',
    marketplace: 'wb',
    status: 'active',
    updatedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    cardsCount: 6,
    videosCount: 2,
    coverMockId: 'ex-cosmetics-1',
  },
  {
    id: 'pr2',
    name: 'Декор для дома',
    category: 'Товары для дома',
    marketplace: 'ozon',
    status: 'active',
    updatedAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
    cardsCount: 12,
    videosCount: 2,
    coverMockId: 'ex-home-1',
  },
  {
    id: 'pr3',
    name: 'Электроника · Pro линейка',
    category: 'Электроника',
    marketplace: 'ym',
    status: 'draft',
    updatedAt: new Date(Date.now() - 3 * 86400_000).toISOString(),
    cardsCount: 4,
    videosCount: 1,
    coverMockId: 'ex-electronics-1',
  },
  {
    id: 'pr4',
    name: 'Зимняя коллекция · обувь',
    category: 'Обувь',
    marketplace: 'wb',
    status: 'archived',
    updatedAt: new Date(Date.now() - 12 * 86400_000).toISOString(),
    cardsCount: 9,
    videosCount: 3,
    coverMockId: 'ex-clothes-2',
  },
];

// ────────────────────────────────────────────────────────────
// MOCK RESULTS (после fake-генерации)
// ────────────────────────────────────────────────────────────

export const mockGeneratedResults: GenerationResult[] = [
  {
    id: 'r1',
    projectName: 'Косметика весна 26',
    concept: 'Студийный каталог',
    wish: 'Лёгкий фон, мягкая тень, акцент на текстуре',
    createdAt: new Date(Date.now() - 60_000).toISOString(),
    mockId: 'result-1',
    versions: [{ id: 'v0', label: 'V0 Оригинал', mockId: 'result-1' }],
  },
  {
    id: 'r2',
    projectName: 'Косметика весна 26',
    concept: 'Студийный каталог',
    wish: 'Лёгкий фон, мягкая тень, акцент на текстуре',
    createdAt: new Date(Date.now() - 60_000).toISOString(),
    mockId: 'result-2',
    versions: [{ id: 'v0', label: 'V0 Оригинал', mockId: 'result-2' }],
  },
  {
    id: 'r3',
    projectName: 'Косметика весна 26',
    concept: 'Студийный каталог',
    wish: 'Лёгкий фон, мягкая тень, акцент на текстуре',
    createdAt: new Date(Date.now() - 60_000).toISOString(),
    mockId: 'result-3',
    versions: [{ id: 'v0', label: 'V0 Оригинал', mockId: 'result-3' }],
  },
  {
    id: 'r4',
    projectName: 'Косметика весна 26',
    concept: 'Студийный каталог',
    wish: 'Лёгкий фон, мягкая тень, акцент на текстуре',
    createdAt: new Date(Date.now() - 60_000).toISOString(),
    mockId: 'result-4',
    versions: [{ id: 'v0', label: 'V0 Оригинал', mockId: 'result-4' }],
  },
];

// ────────────────────────────────────────────────────────────
// BILLING
// ────────────────────────────────────────────────────────────

export const creditPacks: CreditPack[] = [
  { id: 'p50', charges: 50, price: 390, priceFormatted: '390 ₽' },
  { id: 'p150', charges: 150, price: 990, priceFormatted: '990 ₽', bonus: 15 },
  { id: 'p450', charges: 450, price: 2490, priceFormatted: '2 490 ₽', bonus: 60 },
  { id: 'p1300', charges: 1300, price: 6490, priceFormatted: '6 490 ₽', bonus: 200 },
];

export const balanceHistory: BalanceOperation[] = [
  { id: 'op1', type: 'spend', amount: -4, reason: 'Карточка · Сыворотка для лица', date: new Date(Date.now() - 60_000).toISOString() },
  { id: 'op2', type: 'spend', amount: -3, reason: 'Фото · Студийный каталог', date: new Date(Date.now() - 3600_000).toISOString() },
  { id: 'op3', type: 'spend', amount: -3, reason: 'Фото · На модели', date: new Date(Date.now() - 4 * 3600_000).toISOString() },
  { id: 'op4', type: 'bonus', amount: +15, reason: 'Бонус за онбординг', date: new Date(Date.now() - 5 * 86400_000).toISOString() },
  { id: 'op5', type: 'topup', amount: +50, reason: 'Покупка пакета «Старт»', date: new Date(Date.now() - 6 * 86400_000).toISOString() },
  { id: 'op6', type: 'spend', amount: -12, reason: 'Видео · Вращение 360°', date: new Date(Date.now() - 7 * 86400_000).toISOString() },
];

// ────────────────────────────────────────────────────────────
// ONBOARDING
// ────────────────────────────────────────────────────────────

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    question: 'Ваша роль в работе с маркетплейсом?',
    options: [
      { id: 'seller', label: 'Селлер' },
      { id: 'manager', label: 'Менеджер карточек' },
      { id: 'designer', label: 'Дизайнер инфографики' },
      { id: 'none', label: 'Я не работаю на маркетплейсе' },
    ],
  },
  {
    id: 2,
    question: 'Сколько карточек делаете в месяц?',
    options: [
      { id: 'lt20', label: 'до 20' },
      { id: 'lt70', label: 'до 70' },
      { id: 'lt300', label: 'до 300' },
      { id: 'gt300', label: 'более 300' },
    ],
  },
];

export const ONBOARDING_BONUS = 15;
