import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Home Buying Readiness Dashboard',
  description: 'A free, privacy-first budgeting and house-planning calculator. Everything runs client-side — no data leaves your machine.',
};

function Nav({ pathname }) {
  return (
    <nav>
      <div className="nav-inner">
        <Link href="/" className={"logo" + (pathname === "/" ? " active" : "")}>
          House Planner
        </Link>
        <Link href="/rent-vs-buy" className={pathname==="/rent-vs-buy"?"active":""}>
          Rent or Buy
        </Link>
        <Link href="/articles" className={pathname.startsWith('/articles') ? 'active' : ''}>
          Articles
        </Link>
        <Link href="/privacy" className={pathname === '/privacy' ? 'active' : ''}>
          Privacy
        </Link>
        <div className="nav-spacer"></div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <p>
          © 2024–{new Date().getFullYear()} House Planner. All calculations run client-side — your financial data never leaves your device.
        </p>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav pathname={typeof window !== 'undefined' ? window.location.pathname : '/'} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
