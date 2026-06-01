import LoginPageClient from './LoginPageClient';
import { getSeoMetadata } from '@/lib/seo-metadata';

export async function generateMetadata() {
  return getSeoMetadata({
    pageTitle: 'Login',
    pageDescription: 'Sign in to your PUBG UC Store account.',
    noIndex: true,
  });
}

export default function LoginPage() {
  return <LoginPageClient />;
}
