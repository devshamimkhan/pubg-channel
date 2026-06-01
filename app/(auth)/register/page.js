import RegisterPageClient from './RegisterPageClient';
import { getSeoMetadata } from '@/lib/seo-metadata';

export async function generateMetadata() {
  return getSeoMetadata({
    pageTitle: 'Register',
    pageDescription: 'Create your PUBG UC Store account.',
    noIndex: true,
  });
}

export default function RegisterPage() {
  return <RegisterPageClient />;
}
