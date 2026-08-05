'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  // Starts null so the button renders identically on server and first client
  // paint; the inline script in layout.js has already set the real theme on
  // <html> before this ever runs, so there's nothing to flash.
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') || 'light');
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label="Toggle dark mode">
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
