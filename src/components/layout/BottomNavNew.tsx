'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: '🏠' },
  { href: '/diet/enemies', label: '적들의 다이어트', icon: '⚔️' },
  { href: '/diet/my', label: '내 다이어트', icon: '💪' },
  { href: '/notifications', label: '알림', icon: '🔔' },
  { href: '/settings', label: '설정', icon: '⚙️' },
];

const HIDDEN_PATHS = ['/', '/login'];

export default function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function fetchUnread() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setUnreadCount(count ?? 0);

      channel = supabase
        .channel('notifications-badge')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, () => fetchUnread())
        .subscribe();
    }

    fetchUnread();
    return () => { channel?.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (pathname === '/notifications') setUnreadCount(0);
  }, [pathname]);

  if (HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <nav
      className="flex items-center border-t"
      style={{ backgroundColor: '#F4E6C6', borderColor: '#C47B3A' }}
    >
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const isActive = pathname === href || (href !== '/home' && pathname.startsWith(href));
        const showBadge = href === '/notifications' && unreadCount > 0;

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-opacity active:opacity-60"
            style={{ color: isActive ? '#C47B3A' : '#2C1A0E' }}
          >
            <div className="relative">
              <span className="text-xl">{icon}</span>
              {showBadge && (
                <span
                  className="absolute -top-1 -right-2 min-w-[16px] h-4 rounded-full text-[10px] font-bold flex items-center justify-center px-1"
                  style={{ backgroundColor: '#F5A58A', color: '#2C1A0E' }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
