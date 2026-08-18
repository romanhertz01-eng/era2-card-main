import { Container } from '@/components/ui/Container';
import { MessageCircle, Mail, Zap, Clock, ImageIcon, CreditCard, Gift, RefreshCw } from 'lucide-react';

export const metadata = {
  title: 'Поддержка — ERA2 Card',
  description: 'Центр поддержки ERA2 Card. Ответы на частые вопросы и контакты для связи.',
};

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Что такое заряды ⚡?',
    a: 'Заряды — внутренняя валюта сервиса. Каждая генерация списывает определённое количество зарядов: фото и карточка — 5⚡, видео — от 20⚡. При регистрации начисляется 20 бесплатных зарядов.',
  },
  {
    q: 'Почему генерация не запускается?',
    a: 'Проверьте баланс зарядов — его видно в верхней панели. Если зарядов недостаточно, пополните баланс на странице «Баланс». Также убедитесь, что загружено фото товара или заполнено название.',
  },
  {
    q: 'Какие форматы фото принимает сервис?',
    a: 'JPEG, PNG, WebP — до 10 МБ. Фото с iPhone в формате HEIC конвертируются автоматически. Для видео минимальный размер фото — 300×300 пикселей.',
  },
  {
    q: 'Сколько времени занимает генерация?',
    a: 'Фото и карточка — обычно 15–40 секунд. Видео — 2–5 минут, так как обрабатывается отдельным сервисом. Результат появится в истории проекта автоматически.',
  },
  {
    q: 'Как работают бонусы к пакетам?',
    a: 'При покупке пакетов от 150⚡ начисляются бонусные заряды сверху. Например, пакет 150⚡ даёт +15 в подарок — итого 165⚡ на балансе. Бонусы зачисляются сразу после оплаты.',
  },
  {
    q: 'Можно ли получить возврат?',
    a: 'Возврат возможен в течение 24 часов с момента оплаты при условии, что заряды не были использованы. Напишите нам в Telegram с указанием email и суммы платежа.',
  },
  {
    q: 'Как оплатить по безналичному расчёту (для юр. лиц)?',
    a: 'Напишите на billing@era2.ai с указанием реквизитов компании и нужного количества зарядов. Мы выставим счёт в течение одного рабочего дня.',
  },
  {
    q: 'Результат генерации не нравится — что делать?',
    a: 'Используйте кнопку «Улучшить» в карточке результата — она позволяет уточнить задание и перегенерировать с учётом ваших комментариев. Также попробуйте сменить концепт или добавить пожелания в поле стилистики.',
  },
];

export default function SupportPage() {
  return (
    <Container size="narrow" className="py-16 lg:py-20">
      {/* Hero */}
      <div className="mb-12">
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted">поддержка</div>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Как мы можем помочь?
        </h1>
        <p className="mt-3 text-base text-muted">
          Ответим в Telegram — обычно в течение часа в рабочее время.
        </p>
      </div>

      {/* Contact cards */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        <a
          href="https://t.me/card_era2sup_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-4 rounded-3xl border border-line bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-lime hover:shadow-card"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink text-white group-hover:bg-lime group-hover:text-ink transition-colors">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-ink">Telegram</div>
            <div className="mt-0.5 text-sm text-muted">@card_era2sup_bot</div>
            <div className="mt-2 text-xs text-muted">Основной канал поддержки · быстро</div>
          </div>
        </a>

        <a
          href="mailto:billing@era2.ai"
          className="group flex items-start gap-4 rounded-3xl border border-line bg-surface p-6 transition-all hover:-translate-y-0.5 hover:shadow-card"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-3 text-ink transition-colors">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-ink">Email</div>
            <div className="mt-0.5 text-sm text-muted">billing@era2.ai</div>
            <div className="mt-2 text-xs text-muted">Для юр. лиц и вопросов по оплате</div>
          </div>
        </a>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="mb-6 font-display text-xl font-bold tracking-tight text-ink">
          Частые вопросы
        </h2>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-2xl border border-line bg-surface p-5">
              <div className="font-semibold text-ink">{item.q}</div>
              <div className="mt-2 text-sm leading-relaxed text-muted">{item.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-10 rounded-3xl bg-surface-3 p-6 text-center">
        <div className="text-sm text-muted">Не нашли ответ?</div>
        <div className="mt-1 font-semibold text-ink">Напишите нам — разберёмся вместе</div>
        <a
          href="https://t.me/card_era2sup_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-2 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          Написать в Telegram
        </a>
      </div>
    </Container>
  );
}
