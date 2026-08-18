import { ProjectsPage } from '@/components/pages/ProjectsPage';

export const metadata = {
  title: 'Проекты — ERA2 Card',
  description: 'Ваши проекты и сгенерированные карточки товаров для маркетплейсов.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Проекты — ERA2 Card',
    description: 'Управление проектами и карточками товаров',
  },
};

export default function Page() {
  return <ProjectsPage />;
}
