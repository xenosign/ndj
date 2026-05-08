'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: '🏠' },
  { href: '/diet/join', label: '적들의 다이어트', icon: '⚔️' },
  { href: '/diet/my', label: '내 다이어트', icon: '💪' },
  { href: '/settings', label: '설정', icon: '⚙️' },
];

const HIDDEN_PATHS = ['/', '/login'];

export default function BottomNav() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <nav
      className="flex items-center border-t"
      style={{ backgroundColor: '#2C1A0E', borderColor: '#3D2510' }}
    >
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const isActive = pathname === href || (href !== '/home' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-opacity active:opacity-60"
            style={{ color: isActive ? '#F2C14E' : '#E8D5B0' }}
          >
            <span className="text-xl">{icon}</span>
            <span className="text-xs font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
