'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

export default function ScrollableArea({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showIndicator, setShowIndicator] = useState(false);

  const check = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowIndicator(el.scrollHeight - el.scrollTop - el.clientHeight > 20);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    check();
    el.addEventListener('scroll', check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', check);
      ro.disconnect();
    };
  }, [check]);

  return (
    <div className="relative flex-1 overflow-hidden flex flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {children}
      </div>
      {showIndicator && (
        <button
          onClick={() =>
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
          }
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-opacity hover:opacity-85 active:opacity-70"
          style={{ backgroundColor: '#A67FD4' }}
          aria-label="맨 아래로"
        >
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L9 11L17 1" stroke="#1A0A3D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}
