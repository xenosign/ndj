'use client';

import { useEffect, useState } from 'react';

export default function IOSInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone =
      'standalone' in navigator &&
      (navigator as { standalone?: boolean }).standalone === true;
    setShow(isIOS && !isStandalone);
  }, []);

  if (!show) return null;

  return (
    <div
      className="w-full rounded-2xl px-5 py-4 flex items-start gap-3"
      style={{
        backgroundColor: '#EDE0FF',
        border: '1.5px solid #C4A0E8',
      }}
    >
      <span className="text-xl shrink-0 mt-0.5">📲</span>
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-bold" style={{ color: '#4A2B8A' }}>
          아이폰 사용자 안내
        </p>
        <p className="text-xs leading-relaxed" style={{ color: '#7B4DBE' }}>
          푸시 알림을 받으려면 Safari에서{' '}
          <span className="font-bold">공유 버튼 → 홈 화면에 추가</span>를 해주세요.
        </p>
      </div>
    </div>
  );
}
