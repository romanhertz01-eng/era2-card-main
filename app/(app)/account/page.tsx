import { AccountPage } from '@/components/pages/AccountPage';

export const metadata = {
  title: 'Аккаунт — ERA2 Card',
  description: 'Настройки аккаунта, API-ключи и реферальная программа ERA2 Card.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Аккаунт — ERA2 Card',
    description: 'Настройки и управление аккаунтом',
  },
};

export default function Page() {
  return <AccountPage />;
}
