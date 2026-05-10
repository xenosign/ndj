'use client';

import { useRouter } from 'next/navigation';

interface TopHeaderProps {
  title: string;
  showBack?: boolean;
  backHref?: string;
}

export default function TopHeader({ title, showBack = true, backHref }: TopHeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (backHref) router.push(backHref);
    else router.back();
  }

  return (
    <header
      className="flex items-center gap-3 px-5 shrink-0 border-b"
      style={{ backgroundColor: '#F8F4FF', borderColor: '#D4C0F0', height: 56 }}
    >
      {showBack && (
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-8 h-8 rounded-full transition-colors active:opacity-60"
          style={{ color: '#1A0A3D' }}
          aria-label="뒤로가기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      )}
      <h1 className="text-base font-bold" style={{ color: '#1A0A3D' }}>
        {title}
      </h1>
    </header>
  );
}
