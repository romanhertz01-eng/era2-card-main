'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Upload,
  X,
  Sparkles,
  ImagePlus,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { BeforeMockup } from '@/components/mockups/Mockups';
import { TechTag } from '@/components/ui/Badge';
import { demoProducts, productCategories } from '@/lib/mockData';
import type { ProductState } from './StudioPage';
import { cn, isPhotoUrl } from '@/lib/utils';

const MAX_PHOTOS = 2;
const MAX_FILE_MB = 10;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function ProductPanel({
  product,
  onChange,
  isVideo = false,
}: {
  product: ProductState;
  onChange: (p: ProductState) => void;
  isVideo?: boolean;
}) {
  const maxPhotos = isVideo ? 1 : MAX_PHOTOS;

  const fileRef = useRef<HTMLInputElement>(null);
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  // Cleanup всех blob URL на unmount — без зависимостей, через ref
  useEffect(() => {
    const urls = blobUrlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      urls.clear();
    };
  }, []);

  /**
   * Обработка batch файлов: валидирует ВСЕ файлы, собирает URL,
   * одним вызовом onChange добавляет к текущим photos.
   */
  const processFiles = async (incoming: File[]) => {
    if (incoming.length === 0) return;

    const errors: string[] = [];
    const validFiles: File[] = [];

    for (const file of incoming) {
      if (!file.type.startsWith('image/') && file.type !== 'image/heic' && file.type !== 'image/heif' && !file.name.toLowerCase().match(/\.(heic|heif)$/)) {
        errors.push(`«${file.name}» — не изображение`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        errors.push(`«${file.name}» — больше ${MAX_FILE_MB} MB`);
        continue;
      }
      if (isVideo) {
        try {
          const bmp = await createImageBitmap(file);
          const tooSmall = bmp.width < 300 || bmp.height < 300;
          bmp.close();
          if (tooSmall) {
            errors.push(`«${file.name}» — нужно минимум 300×300 пикселей`);
            continue;
          }
        } catch { /* пропускаем проверку если браузер не поддерживает */ }
      }
      validFiles.push(file);
    }

    const slotsAvailable = maxPhotos - product.photos.length;
    const willAdd = validFiles.slice(0, slotsAvailable);
    const skippedDueLimit = validFiles.length - willAdd.length;

    if (skippedDueLimit > 0) {
      errors.push(
        `Пропущено ${skippedDueLimit} ${pluralize(
          skippedDueLimit,
          'файл',
          'файла',
          'файлов'
        )} — лимит ${maxPhotos} фото`
      );
    }

    if (willAdd.length === 0) {
      setError(
        errors.length > 0 ? errors.join(' · ') : 'Не выбрано подходящих файлов'
      );
      return;
    }

    // Создаём все URL и сразу регистрируем их в ref
    const newUrls = willAdd.map((f) => {
      const url = URL.createObjectURL(f);
      blobUrlsRef.current.add(url);
      return url;
    });

    setError(errors.length > 0 ? errors.join(' · ') : null);

    // ОДИН onChange с обновлённым массивом
    onChange({ ...product, photos: [...product.photos, ...newUrls] });
  };

  const handleFilesFromInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFiles(Array.from(files));
    // Сбрасываем input, чтобы можно было выбрать тот же файл повторно
    e.target.value = '';
  };

  const revokeIfBlob = (url: string) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
    }
  };

  const removePhoto = (idx: number) => {
    const photo = product.photos[idx];
    if (photo) revokeIfBlob(photo);
    onChange({ ...product, photos: product.photos.filter((_, i) => i !== idx) });
  };

  const clearAll = () => {
    product.photos.forEach(revokeIfBlob);
    onChange({ ...product, photos: [] });
    setError(null);
  };

  const loadDemo = (mockId: string, name: string, category: string) => {
    // Сначала очищаем текущие blob URLs
    product.photos.forEach(revokeIfBlob);
    onChange({ photos: [mockId], name, category });
    setError(null);
  };

  // ─── DnD ───
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragOver) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    await processFiles(Array.from(files));
  };

  return (
    <div className="rounded-3xl border border-line bg-surface">
      {/* Header (clickable on mobile to collapse) */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between gap-2 p-5 pb-3 text-left lg:cursor-default"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">01</span>
          <h3 className="font-display text-base font-bold tracking-tight text-ink">
            Ваш товар
          </h3>
          {product.photos.length > 0 && (
            <span className="rounded-md bg-lime-tint px-1.5 py-0.5 text-[10px] font-semibold text-ink">
              {product.photos.length}/{maxPhotos}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {product.photos.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  clearAll();
                }
              }}
              className="cursor-pointer text-xs font-medium text-muted underline decoration-line underline-offset-2 hover:text-ink"
            >
              Очистить
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted transition-transform lg:hidden',
              collapsed && '-rotate-90'
            )}
          />
        </div>
      </button>

      <div className={cn('px-5 pb-5', collapsed && 'hidden lg:block')}>
        {/* Photo grid + dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'rounded-2xl border-2 border-dashed p-2 transition-colors',
            dragOver
              ? 'border-lime-hi bg-lime-tint'
              : 'border-transparent bg-transparent'
          )}
        >
          <div className={cn('grid gap-2', maxPhotos === 1 ? 'grid-cols-2' : 'grid-cols-4')}>
            {Array.from({ length: maxPhotos }).map((_, idx) => {
              const photo = product.photos[idx];
              if (photo) {
                return (
                  <div key={idx} className="group relative">
                    {isPhotoUrl(photo) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt={`Фото ${idx + 1}`}
                        className="aspect-square h-auto w-full rounded-xl object-cover ring-1 ring-line"
                      />
                    ) : (
                      <BeforeMockup mockId={photo} className="!aspect-square !rounded-xl" />
                    )}
                    <button
                      onClick={() => removePhoto(idx)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Удалить"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              }
              if (idx === product.photos.length && product.photos.length < maxPhotos) {
                return (
                  <button
                    key={idx}
                    onClick={() => fileRef.current?.click()}
                    className="group flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface-3 transition-colors hover:border-lime-hi hover:bg-lime-tint"
                    aria-label="Загрузить фото"
                  >
                    <ImagePlus className="h-5 w-5 text-muted group-hover:text-ink" />
                  </button>
                );
              }
              return (
                <div
                  key={idx}
                  className="aspect-square rounded-xl border border-dashed border-line/60 bg-surface-3/50"
                />
              );
            })}
          </div>

          {dragOver && (
            <div className="mt-2 rounded-xl bg-lime/20 px-3 py-2 text-center text-xs font-semibold text-ink">
              Отпустите файл, чтобы загрузить
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple={!isVideo}
          className="hidden"
          onChange={handleFilesFromInput}
        />

        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
          <Upload className="h-3 w-3" />
          {isVideo
            ? `${product.photos.length}/1 · стартовый кадр видео · мин. 300×300 px · до ${MAX_FILE_MB} MB`
            : `${product.photos.length}/${maxPhotos} · перетащите или нажмите · до ${MAX_FILE_MB} MB`}
        </p>

        {error && (
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo products — hidden, uncomment to restore
        <div className="mt-5 border-t border-line pt-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-lime" fill="currentColor" />
            <span className="text-xs font-semibold text-ink-2">Демо-товары</span>
            <TechTag>для теста</TechTag>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {demoProducts.map((dp) => {
              const active = product.photos[0] === dp.mockId;
              return (
                <button
                  key={dp.id}
                  onClick={() => loadDemo(dp.mockId, dp.name, dp.category)}
                  className={cn(
                    'group relative overflow-hidden rounded-xl border transition-all',
                    active
                      ? 'border-ink bg-surface-3'
                      : 'border-line bg-surface hover:border-line-3'
                  )}
                >
                  <BeforeMockup mockId={dp.mockId} className="!aspect-square !rounded-none" />
                  <div className="border-t border-line bg-surface px-1.5 py-1">
                    <div className="truncate text-[9px] font-medium text-ink">{dp.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        */}

        {/* Product name */}
        <div className="mt-5 space-y-3 border-t border-line pt-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-2">Название товара</span>
            <input
              value={product.name}
              onChange={(e) => onChange({ ...product, name: e.target.value })}
              placeholder="Например, Сыворотка с витамином C"
              className="h-10 w-full rounded-xl border border-line bg-surface-3 px-3 text-sm text-ink placeholder:text-muted-2 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-2">Категория</span>
            <div className="relative">
              <select
                value={product.category}
                onChange={(e) => onChange({ ...product, category: e.target.value })}
                className="h-10 w-full appearance-none rounded-xl border border-line bg-surface-3 px-3 pr-9 text-sm text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
              >
                {productCategories.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
