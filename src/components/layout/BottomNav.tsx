'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/home', label: '홈', icon: '🏠' },
  { href: '/diet/my', label: '내 다이어트', icon: '💪' },
  { href: '/settings', label: '환경설정', icon: '⚙️' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-center border-t"
      style={{ backgroundColor: '#2C1A0E', borderColor: '#3D2510' }}
    >
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const isActive = pathname === href || pathname.startsWith(href === '/home' ? '/home' : href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-opacity active:opacity-60"
            style={{ color: isActive ? '#F2C14E' : '#7B4A2D' }}
          >
            <span className="text-xl">{icon}</span>
            <span className="text-xs font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
