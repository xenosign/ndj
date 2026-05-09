'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LEFT_ITEMS = [
  { href: '/home', label: '홈', icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#7B6EF6' : 'none'} stroke={active ? '#7B6EF6' : '#9898A6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )},
  { href: '/diet/enemies', label: '적들', icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#7B6EF6' : '#9898A6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )},
];

const RIGHT_ITEMS = [
  { href: '/diet/my', label: '내 다이어트', icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#7B6EF6' : '#9898A6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )},
  { href: '/settings', label: '설정', icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#7B6EF6' : '#9898A6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  )},
];

const HIDDEN_PATHS = ['/', '/login'];

export default function BottomNav() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.includes(pathname)) return null;

  const isActive = (href: string) =>
    pathname === href || (href !== '/home' && pathname.startsWith(href));

  return (
    <nav
      className="flex items-center border-t shrink-0"
      style={{ backgroundColor: '#FFFFFF', borderColor: '#EBEBF5', height: 64 }}
    >
      {LEFT_ITEMS.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-1 flex-col items-center justify-center gap-1 h-full transition-opacity active:opacity-60"
        >
          {icon(isActive(href))}
          <span
            className="text-[10px] font-medium"
            style={{ color: isActive(href) ? '#7B6EF6' : '#9898A6' }}
          >
            {label}
          </span>
        </Link>
      ))}

      {/* 중앙 + 버튼 */}
      <div className="flex flex-col items-center justify-center px-3">
        <Link
          href="/diet/start"
          className="flex items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
          style={{ width: 52, height: 52, backgroundColor: '#7B6EF6' }}
          aria-label="다이어트 시작"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </Link>
      </div>

      {RIGHT_ITEMS.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-1 flex-col items-center justify-center gap-1 h-full transition-opacity active:opacity-60"
        >
          {icon(isActive(href))}
          <span
            className="text-[10px] font-medium"
            style={{ color: isActive(href) ? '#7B6EF6' : '#9898A6' }}
          >
            {label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
