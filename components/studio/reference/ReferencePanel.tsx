'use client';

import { useRef, useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { ImagePlus, X, ChevronDown, AlertCircle, Zap, Info, Loader2 } from 'lucide-react';
import { productCategories } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import {
  type ReferenceState,
  REFERENCE_COST,
  MAX_REFERENCES,
} from './useReferenceGeneration';

interface RecognizeResponse {
  name: string;
  category: string | null;
  confidence: number;
}

const MAX_FILE_MB = 10;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

function isValidImageFile(file: File): boolean {
  return (
    file.type.startsWith('image/') ||
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

interface ReferencePanelProps {
  state: ReferenceState;
  onChange: Dispatch<SetStateAction<ReferenceState>>;
  status: 'idle' | 'loading' | 'success' | 'error';
  charges: number;
  onGenerate: () => void;
}

export function ReferencePanel({ state, onChange, status, charges, onGenerate }: ReferencePanelProps) {
  const productFileRef = useRef<HTMLInputElement>(null);
  const referencesFileRef = useRef<HTMLInputElement>(null);
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const [dragOverProduct, setDragOverProduct] = useState(false);
  const [dragOverRefs, setDragOverRefs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const [recognizing, setRecognizing] = useState(false);

  useEffect(() => {
    const urls = blobUrlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      urls.clear();
    };
  }, []);

  const cost = REFERENCE_COST * state.references.length;
  const hasProduct = !!state.productPhoto;
  const hasReferences = state.references.length > 0;
  const insufficientBalance = hasProduct && hasReferences && charges < cost;

  // ─── Product photo (single slot) ───
  const handleProductFiles = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (!isValidImageFile(file)) {
      setError(`«${file.name}» — не изображение`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(`«${file.name}» — больше ${MAX_FILE_MB} MB`);
      return;
    }
    if (state.productPhoto?.startsWith('blob:')) {
      URL.revokeObjectURL(state.productPhoto);
      blobUrlsRef.current.delete(state.productPhoto);
    }
    const url = URL.createObjectURL(file);
    blobUrlsRef.current.add(url);
    setError(null);
    onChange({ ...state, productPhoto: url, productName: '', category: 'Косметика' });
    void recognizeProduct(file);
  };

  const recognizeProduct = async (file: File) => {
    setRecognizing(true);
    try {
      const fd = new FormData();
      fd.append('image', file, file.name);
      const result = await api.postForm<RecognizeResponse>('/api/generations/recognize-product', fd);
      if (result?.name || result?.category) {
        // Функциональный апдейтер — чтобы не затереть то, что пользователь успел
        // поменять (или убрать фото), пока шёл запрос распознавания
        onChange((prev) => {
          if (!prev.productPhoto) return prev; // фото убрали, пока распознавали
          return {
            ...prev,
            productName: result.name || prev.productName,
            category: result.category && productCategories.includes(result.category) ? result.category : prev.category,
          };
        });
      }
    } catch {
      // Тихо игнорируем — поля остаются пустыми и редактируемыми
    } finally {
      setRecognizing(false);
    }
  };

  const removeProductPhoto = () => {
    if (state.productPhoto?.startsWith('blob:')) {
      URL.revokeObjectURL(state.productPhoto);
      blobUrlsRef.current.delete(state.productPhoto);
    }
    onChange({ ...state, productPhoto: null, productName: '', category: 'Косметика' });
  };

  // ─── References (grid, up to MAX_REFERENCES) ───
  const handleReferenceFiles = (files: File[]) => {
    if (files.length === 0) return;
    const errors: string[] = [];
    const valid: File[] = [];

    for (const file of files) {
      if (!isValidImageFile(file)) {
        errors.push(`«${file.name}» — не изображение`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        errors.push(`«${file.name}» — больше ${MAX_FILE_MB} MB`);
        continue;
      }
      valid.push(file);
    }

    const slotsAvailable = MAX_REFERENCES - state.references.length;
    const willAdd = valid.slice(0, slotsAvailable);
    if (valid.length > willAdd.length) {
      errors.push(`Максимум ${MAX_REFERENCES} референсов`);
    }

    if (willAdd.length === 0) {
      setError(errors.length > 0 ? errors.join(' · ') : 'Не выбрано подходящих файлов');
      return;
    }

    const newUrls = willAdd.map((f) => {
      const url = URL.createObjectURL(f);
      blobUrlsRef.current.add(url);
      return url;
    });
    setError(errors.length > 0 ? errors.join(' · ') : null);
    onChange({ ...state, references: [...state.references, ...newUrls] });
  };

  const removeReference = (idx: number) => {
    const url = state.references[idx];
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
    }
    onChange({ ...state, references: state.references.filter((_, i) => i !== idx) });
  };

  const ctaState = (() => {
    if (status === 'loading') return { text: `Генерируем…`, sub: `${state.references.length} карточки · обычно около минуты`, disabled: true, variant: 'default' as const };
    if (!hasProduct) return { text: 'Добавьте фото товара', sub: 'Загрузите товар и хотя бы один референс', disabled: true, variant: 'default' as const };
    if (recognizing) return { text: 'Распознаём товар…', sub: 'Определяем название и категорию', disabled: true, variant: 'default' as const };
    if (!hasReferences) return { text: 'Добавьте референс', sub: 'По каждому референсу получится отдельная карточка', disabled: true, variant: 'default' as const };
    if (insufficientBalance) return { text: 'Пополнить баланс', sub: `Не хватает ${cost - charges} ⚡ — на балансе ${charges}`, disabled: false, variant: 'dark' as const };
    return {
      text: `Создать ${state.references.length} ${state.references.length === 1 ? 'карточку' : 'карточки'}`,
      sub: `Косметика · формат ${state.aspectRatio === 'auto' ? 'как в референсе' : state.aspectRatio} · останется ${charges - cost} ⚡`,
      disabled: false,
      variant: 'lime' as const,
    };
  })();

  return (
    <div className="rounded-3xl border border-line bg-surface p-5">
      {/* Шаг 1 · Товар */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted">01</span>
        <h3 className="font-display text-base font-bold tracking-tight text-ink">Ваш товар</h3>
      </div>

      <div className="mt-3">
        {state.productPhoto ? (
          <div className="group relative w-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.productPhoto}
              alt="Товар"
              className="aspect-square w-32 rounded-xl object-cover ring-1 ring-line"
            />
            <button
              onClick={removeProductPhoto}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Удалить"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => productFileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOverProduct(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragOverProduct(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverProduct(false);
              handleProductFiles(Array.from(e.dataTransfer.files));
            }}
            className={cn(
              'flex aspect-square w-32 items-center justify-center rounded-xl border-2 border-dashed transition-colors',
              dragOverProduct ? 'border-lime-hi bg-lime-tint' : 'border-line bg-surface-3 hover:border-lime-hi hover:bg-lime-tint'
            )}
          >
            <ImagePlus className="h-5 w-5 text-muted" />
          </button>
        )}
        <input
          ref={productFileRef}
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleProductFiles(Array.from(e.target.files));
            e.target.value = '';
          }}
        />
        <p className="mt-2 text-[11px] text-muted">Товар останется точно таким же: форма, цвет, материал, логотип.</p>
      </div>

      {hasProduct && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                value={state.productName}
                onChange={(e) => onChange({ ...state, productName: e.target.value })}
                placeholder="Название товара"
                className="h-10 w-full rounded-xl border border-line bg-surface-3 px-3 text-sm text-ink placeholder:text-muted-2 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
              {recognizing && (
                <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted" />
                </span>
              )}
            </div>
            <div className="relative">
              <select
                value={state.category}
                onChange={(e) => onChange({ ...state, category: e.target.value })}
                disabled={recognizing}
                className="h-10 w-full appearance-none rounded-xl border border-line bg-surface-3 px-3 pr-8 text-sm text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-60"
              >
                {productCategories.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                {recognizing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted" />
                )}
              </span>
            </div>
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-[11px] italic text-muted">
            {recognizing ? 'Распознаём товар…' : 'Это распознано по фото — можно поправить'}
          </p>
        </div>
      )}

      {/* Шаг 2 · Референсы */}
      <div className={cn('mt-6 border-t border-line pt-5', (!hasProduct || recognizing) && 'pointer-events-none opacity-40')}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">02</span>
            <h3 className="font-display text-base font-bold tracking-tight text-ink">Референсы</h3>
          </div>
          <span
            className={cn(
              'rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
              state.references.length === MAX_REFERENCES ? 'bg-lime text-ink' : 'bg-surface-3 text-muted'
            )}
          >
            {state.references.length}/{MAX_REFERENCES}
          </span>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOverRefs(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOverRefs(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverRefs(false);
            handleReferenceFiles(Array.from(e.dataTransfer.files));
          }}
          className={cn(
            'mt-3 rounded-2xl border-2 border-dashed p-2 transition-colors',
            dragOverRefs ? 'border-lime-hi bg-lime-tint' : 'border-transparent'
          )}
        >
          <div className="grid grid-cols-3 gap-2">
            {state.references.map((url, idx) => (
              <div key={url} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Референс ${idx + 1}`} className="aspect-[3/4] w-full rounded-xl object-cover ring-1 ring-line" />
                <span className="absolute left-1 top-1 rounded-md bg-ink/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {idx + 1}
                </span>
                <button
                  onClick={() => removeReference(idx)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Удалить"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {state.references.length < MAX_REFERENCES && (
              <button
                onClick={() => referencesFileRef.current?.click()}
                className="flex aspect-[3/4] items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface-3 transition-colors hover:border-lime-hi hover:bg-lime-tint"
                aria-label="Добавить референс"
              >
                <ImagePlus className="h-5 w-5 text-muted" />
              </button>
            )}
          </div>
        </div>
        <input
          ref={referencesFileRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleReferenceFiles(Array.from(e.target.files));
            e.target.value = '';
          }}
        />

        {hasReferences && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface-3 px-3 py-2 text-xs text-ink-2">
            <span className="font-mono font-bold text-ink">{state.references.length} → {state.references.length}</span>
            <span>{state.references.length === 1 ? 'референс → карточка' : 'референса → карточки'}, каждая генерируется отдельно</span>
          </div>
        )}

        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          Копируем принцип оформления, а не бренд: чужие логотипы, надписи и лица не переносятся.
        </p>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Уточнить */}
      <div className={cn('mt-5 border-t border-line pt-4', !hasProduct && 'pointer-events-none opacity-40')}>
        <button
          onClick={() => setRefineOpen(!refineOpen)}
          className="flex w-full items-center justify-between text-left text-xs font-semibold text-ink-2"
        >
          <span>⚙ Уточнить — необязательно</span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted transition-transform', refineOpen && 'rotate-180')} />
        </button>
        {refineOpen && (
          <div className="mt-3 space-y-3">
            <textarea
              value={state.wishes}
              onChange={(e) => onChange({ ...state, wishes: e.target.value })}
              placeholder="Пожелания к результату"
              rows={2}
              className="w-full rounded-xl border border-line bg-surface-3 px-3 py-2 text-sm text-ink placeholder:text-muted-2 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
            <div>
              <span className="mb-1.5 block text-xs font-medium text-ink-2">Соотношение сторон</span>
              <div className="grid grid-cols-4 gap-1.5">
                {(['auto', '3:4', '1:1', '9:16'] as const).map((ar) => (
                  <button
                    key={ar}
                    onClick={() => onChange({ ...state, aspectRatio: ar })}
                    className={cn(
                      'h-8 rounded-lg border text-xs font-medium transition-colors',
                      state.aspectRatio === ar
                        ? 'border-ink bg-ink text-white'
                        : 'border-line bg-surface text-ink-2 hover:bg-surface-2'
                    )}
                  >
                    {ar === 'auto' ? 'как референс' : ar}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={onGenerate}
        disabled={ctaState.disabled}
        className={cn(
          'mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          ctaState.variant === 'lime' && 'bg-lime text-ink hover:bg-lime-hi',
          ctaState.variant === 'dark' && 'bg-ink text-white hover:bg-ink-2',
          ctaState.variant === 'default' && 'bg-surface-3 text-muted'
        )}
      >
        {ctaState.text}
        {ctaState.variant === 'lime' && (
          <>
            <Zap className="h-3.5 w-3.5 fill-ink" />
            <span className="tabular-nums">{cost}</span>
          </>
        )}
      </button>
      <p className="mt-2 text-center text-[11px] text-muted">{ctaState.sub}</p>
    </div>
  );
}
