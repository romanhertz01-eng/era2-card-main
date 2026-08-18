import { BillingPage } from '@/components/pages/BillingPage';

export const metadata = {
  title: 'Баланс — ERA2 Card',
  description: 'Управляйте зарядами ⚡, пополняйте баланс и просматривайте историю операций.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Баланс — ERA2 Card',
    description: 'Управление зарядами и оплата',
  },
};

export default function Page() {
  return <BillingPage />;
}
