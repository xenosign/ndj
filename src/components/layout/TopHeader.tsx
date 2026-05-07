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
      className="flex items-center gap-3 px-5 py-4 shrink-0"
      style={{ backgroundColor: '#2C1A0E' }}
    >
      {showBack && (
        <button
          onClick={handleBack}
          className="text-xl w-8"
          style={{ color: '#F4E6C6' }}
          aria-label="뒤로가기"
        >
          ←
        </button>
      )}
      <h1 className="text-lg font-bold" style={{ color: '#F2C14E' }}>
        {title}
      </h1>
    </header>
  );
}
