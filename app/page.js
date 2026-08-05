import Link from 'next/link';

export const metadata = {
  title: 'House Planner — Rent or Buy, Planned Simply',
  description: 'A free, privacy-first calculator that shows whether renting or buying makes sense for you, and how soon you could be ready. Nothing leaves your device.',
};

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1 className="hero-title">Know exactly when you're ready to buy.</h1>
        <p className="hero-sub">
          A free calculator that turns your income, debt, and savings into a straight
          answer: keep renting, or start saving for a house, and how long that takes.
          Everything runs on your device. Nothing is uploaded, ever.
        </p>
        <div className="hero-actions">
          <Link href="/dashboard" className="btn-primary">Open the Calculator</Link>
          <Link href="/articles" className="btn-secondary">Read the Articles</Link>
        </div>
      </section>

      <section className="feature-grid">
        <div className="feature">
          <h2>Your full budget, in one place</h2>
          <p>Income, taxes, debt, savings goals, and a mortgage plan, all connected so changing one number updates everything downstream.</p>
        </div>
        <div className="feature">
          <h2>Rent vs. buy, made concrete</h2>
          <p>A separate tool shows the exact year buying overtakes renting for your numbers, not a generic rule of thumb.</p>
        </div>
        <div className="feature">
          <h2>Private by design</h2>
          <p>No accounts, no analytics, no server. Your financial details stay in your browser unless you choose to save a file yourself.</p>
        </div>
      </section>

      <section className="home-cta">
        <h2>Ready to see your numbers?</h2>
        <p>Takes about five minutes. Nothing to sign up for.</p>
        <Link href="/dashboard" className="btn-primary">Start Planning</Link>
      </section>
    </div>
  );
}
