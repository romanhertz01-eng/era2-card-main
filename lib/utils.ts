import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Объединяет классы с разрешением конфликтов Tailwind */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** «1 250 ₽» / «12 500 ₽» */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
}

/** «48 ⚡» с разделителем */
export function formatCharges(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

/** «2 ч назад», «вчера», «3 дн назад» */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} мин назад`;
  if (diffH < 24) return `${diffH} ч назад`;
  if (diffD === 1) return 'вчера';
  if (diffD < 7) return `${diffD} дн назад`;
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
  });
}

/** Задержка-промис (для имитации генерации) */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Случайный ID */
export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Это blob/data/http URL, а не наш внутренний mockId? */
export function isPhotoUrl(p: string): boolean {
  return p.startsWith('blob:') || p.startsWith('data:') || p.startsWith('http');
}

/** Скачивает строку как файл — для mock-download карточек */
export function downloadAsFile(content: string, filename: string, mime = 'image/svg+xml'): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
