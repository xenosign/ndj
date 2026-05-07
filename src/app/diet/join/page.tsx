'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopHeader from '@/components/layout/TopHeader';

export default function DietJoinPage() {
  const router = useRouter();
  const [code, setCode] = useState('');

  function handleSubmit() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 16) return;
    router.push(`/diet/join/${trimmed}`);
  }

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#2C1A0E' }}>
      <TopHeader title="적 다이어트 참여" backHref="/home" />
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <p className="text-base font-semibold text-center" style={{ color: '#E8D5B0' }}>
          시크릿 코드를 입력하세요
        </p>
        <input
          type="text"
          maxLength={16}
          placeholder="XXXXXXXXXXXXXXXX"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          className="w-full h-14 px-4 rounded-xl text-center text-lg font-bold outline-none"
          style={{
            backgroundColor: '#3D2510',
            color: '#F2C14E',
            letterSpacing: '0.15em',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={code.trim().length !== 16}
          className="w-full h-14 rounded-xl font-bold text-base transition-opacity hover:opacity-85 active:opacity-70 disabled:opacity-40"
          style={{ backgroundColor: '#F2C14E', color: '#2C1A0E' }}
        >
          참여하기
        </button>
      </div>
    </main>
  );
}
