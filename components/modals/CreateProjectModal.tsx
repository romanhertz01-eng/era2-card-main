'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FolderPlus, ChevronDown } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/app/providers';
import { productCategories } from '@/lib/mockData';

const MARKETPLACES = [
  { id: 'wb', label: 'Wildberries' },
  { id: 'ozon', label: 'Ozon' },
  { id: 'ym', label: 'Яндекс Маркет' },
] as const;

export function CreateProjectModal() {
  const router = useRouter();
  const { createProjectModal, closeCreateProjectModal, createProject, setActiveProjectId } = useApp();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Косметика');
  const [marketplace, setMarketplace] = useState<string>('wb');

  const submit = async () => {
    if (!name.trim()) return;
    await createProject(name.trim(), category, marketplace);
    setName('');
    closeCreateProjectModal();
    router.push('/studio');
  };

  return (
    <Modal open={createProjectModal.open} onClose={closeCreateProjectModal} size="sm">
      <div className="p-6 sm:p-8">
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime">
            <FolderPlus className="h-4 w-4 text-ink" />
          </div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
            новый проект
          </div>
        </div>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
          Создать проект
        </h2>
        <p className="mt-1 text-sm text-muted">
          Группируйте карточки по категориям, линейкам или клиентам.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-2">Название</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
              placeholder="Например, Косметика весна 26"
              className="h-11 w-full rounded-xl border border-line bg-surface-3 px-3.5 text-sm text-ink placeholder:text-muted-2 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-2">Категория</span>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-line bg-surface-3 px-3.5 pr-10 text-sm text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
              >
                {productCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            </div>
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-ink-2">Маркетплейс</span>
            <div className="grid grid-cols-3 gap-2">
              {MARKETPLACES.map((mp) => (
                <button
                  key={mp.id}
                  type="button"
                  onClick={() => setMarketplace(mp.id)}
                  className={`h-10 rounded-xl border text-xs font-medium transition-colors ${
                    marketplace === mp.id
                      ? 'border-ink bg-ink text-white'
                      : 'border-line bg-surface-3 text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  {mp.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-7 flex gap-2">
          <button
            onClick={closeCreateProjectModal}
            className="h-11 flex-1 rounded-xl border border-line bg-surface text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2"
          >
            Отмена
          </button>
          <button
            disabled={!name.trim()}
            onClick={submit}
            className="h-11 flex-1 rounded-xl bg-ink text-sm font-semibold text-white transition-colors hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Создать
          </button>
        </div>
      </div>
    </Modal>
  );
}
