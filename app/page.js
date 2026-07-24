import Dashboard from './dashboard/Dashboard';

export const metadata = {
  title: 'Home Buying Readiness Dashboard',
  description: 'A free, privacy-first budgeting and house-planning calculator. Everything runs client-side.',
};

export default function Home() {
  return <Dashboard />;
}
