import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-2 px-6">
      <div className="text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-muted">
          404 · not_found
        </div>
        <h1 className="font-display text-display-md font-bold tracking-tight text-ink">
          Здесь пусто
        </h1>
        <p className="mx-auto mt-4 max-w-md text-balance text-base text-muted">
          Страница не найдена. Возможно, она ещё в разработке или ссылка устарела.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-ink px-6 py-3 text-sm font-semibold text-surface transition-transform hover:-translate-y-0.5"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
}
