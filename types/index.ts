// ────────────────────────────────────────────────────────────
// USER
// ────────────────────────────────────────────────────────────

export interface MockUser {
  id: string;
  name: string;
  initials: string;
  email: string;
  company: string;
  tier: 'Старт' | 'Креатор' | 'Студия' | 'Бизнес';
  joinedAt: string;
}

// ────────────────────────────────────────────────────────────
// MARKETPLACES & GENERATOR
// ────────────────────────────────────────────────────────────

export type Marketplace = 'wb' | 'ozon' | 'ym';

export interface MarketplaceInfo {
  id: Marketplace;
  name: string;
  short: string;
  color: string;
}

export type ContentType = 'photo' | 'card' | 'video';

export interface ContentTypeInfo {
  id: ContentType;
  name: string;
  description: string;
  cost: number;
}

export interface Concept {
  id: string;
  name: string;
  description: string;
  preview: string; // mockup id
  type: ContentType;
}

export interface DemoProduct {
  id: string;
  name: string;
  category: string;
  mockId: string;
}

// ────────────────────────────────────────────────────────────
// PROJECTS & RESULTS
// ────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  category: string;
  marketplace: Marketplace;
  status: 'active' | 'archived' | 'draft';
  updatedAt: string;
  cardsCount: number;
  videosCount: number;
  coverMockId: string;
}

export interface GenerationResult {
  id: string;
  projectName: string;
  concept: string;
  wish: string;
  createdAt: string;
  mockId: string;
  versions: ResultVersion[];
  liked?: boolean;
  task?: 'photo' | 'card' | 'video';
}

export interface ResultVersion {
  id: string;
  label: string; // V0 Оригинал / V1 Улучшение
  mockId: string;
  prompt?: string;
}

export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingStep {
  id: string;
  text: string;
  duration: number; // ms
}

// ────────────────────────────────────────────────────────────
// LANDING DATA
// ────────────────────────────────────────────────────────────

export interface Feature {
  id: string;
  icon: string; // lucide name
  title: string;
  description: string;
  badge?: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  mockId: string;
  contentType: ContentType;
  conceptId: string;
  wish?: string;
}

export interface Example {
  id: string;
  category: ExampleCategory;
  productName: string;
  mockId: string;
  marketplace: Marketplace;
  resultType: 'card' | 'lifestyle' | 'video_cover' | 'before_after';
}

export type ExampleCategory =
  | 'cosmetics'
  | 'clothes'
  | 'shoes'
  | 'accessories'
  | 'electronics'
  | 'home'
  | 'kids'
  | 'food';

export interface Audience {
  id: string;
  icon: string;
  title: string;
  pain: string;
  benefit: string;
}

export interface SavingItem {
  id: string;
  title: string;
  description: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  priceFormatted: string;
  charges: number;
  perks: string[];
  popular?: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  initials: string;
  marketplace: Marketplace;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface Era2Product {
  id: string;
  name: string;
  url: string;
  description: string;
  status: 'live' | 'soon' | 'rnd';
}

// ────────────────────────────────────────────────────────────
// BILLING
// ────────────────────────────────────────────────────────────

export interface CreditPack {
  id: string;
  charges: number;
  price: number;
  priceFormatted: string;
  bonus?: number;
}

export interface BalanceOperation {
  id: string;
  type: 'topup' | 'spend' | 'bonus';
  amount: number;
  reason: string;
  date: string;
}

// ────────────────────────────────────────────────────────────
// ONBOARDING
// ────────────────────────────────────────────────────────────

export interface OnboardingOption {
  id: string;
  label: string;
}

export interface OnboardingStep {
  id: number;
  question: string;
  options: OnboardingOption[];
}
