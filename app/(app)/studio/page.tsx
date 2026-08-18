import { StudioPage } from '@/components/studio/StudioPage';

export const metadata = {
  title: 'Студия — ERA2 Card',
  description: 'Создавайте продающие карточки товаров, инфографику и видео для Wildberries, Ozon и Яндекс Маркета с помощью ИИ.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Студия — ERA2 Card',
    description: 'AI-генерация карточек товаров для маркетплейсов',
  },
};

export default function Page() {
  return <StudioPage />;
}
