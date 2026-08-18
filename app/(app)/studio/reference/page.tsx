import { ReferenceStudioPage } from '@/components/studio/reference/ReferenceStudioPage';

export const metadata = {
  title: 'По референсу — ERA2 Card',
  description: 'Создавайте карточки товаров в стиле любых референсов с помощью ИИ.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ReferenceStudioPage />;
}
