import './globals.css';
import Nav from './Nav';

export const metadata = {
  title: 'House Planner — Rent or Buy, Planned Simply',
  description: 'A free, privacy-first budgeting and house-planning calculator. Everything runs client-side — no data leaves your machine.',
};

// Sets the theme class before React hydrates, so there's no flash of the
// wrong theme on load. Reads localStorage first, then falls back to the
// browser/OS preference.
const THEME_INIT = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <p>
          © 2024–{new Date().getFullYear()} House Planner. All calculations run client-side — your financial data never leaves your device.
          {' '}·{' '}
          <a href="/privacy">Privacy</a>
        </p>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
