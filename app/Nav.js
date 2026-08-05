'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav>
      <div className="nav-inner">
        <Link href="/" className={"logo" + (pathname === "/" ? " active" : "")}>
          House Planner
        </Link>
        <Link href="/dashboard" className={pathname === '/dashboard' ? 'active' : ''}>
          Calculator
        </Link>
        <Link href="/rent-vs-buy" className={pathname === "/rent-vs-buy" ? "active" : ""}>
          Rent or Buy
        </Link>
        <Link href="/articles" className={pathname.startsWith('/articles') ? 'active' : ''}>
          Articles
        </Link>
        <div className="nav-spacer"></div>
        <ThemeToggle />
      </div>
    </nav>
  );
}
