'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

export default function InviteModal({ inviteCode }: { inviteCode: string }) {
  const [open, setOpen] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/diet/join/${inviteCode}`);
  }, [inviteCode]);

  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl font-semibold text-sm py-4 transition-opacity hover:opacity-85 active:opacity-70"
        style={{ backgroundColor: '#F2C14E', color: '#2C1A0E' }}
      >
        ⚔️ 적들 초대하기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl px-6 pt-6 pb-10 flex flex-col items-center gap-6"
            style={{ backgroundColor: '#3D2510' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 핸들 */}
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#7B4A2D' }} />

            <h2 className="text-lg font-bold" style={{ color: '#F2C14E' }}>
              ⚔️ 적들 초대하기
            </h2>

            {/* 시크릿 코드 */}
            <div className="w-full flex flex-col items-center gap-3">
              <p className="text-xs font-medium" style={{ color: '#E8D5B0' }}>
                시크릿 코드
              </p>
              <div
                className="w-full py-3 px-4 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#2C1A0E' }}
              >
                <span
                  className="text-xl font-bold"
                  style={{ color: '#F2C14E', letterSpacing: '0.15em' }}
                >
                  {inviteCode}
                </span>
              </div>
              <button
                onClick={copyCode}
                className="h-11 px-8 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85 active:opacity-70"
                style={{ backgroundColor: '#C47B3A', color: '#FAFAF7' }}
              >
                {copied ? '✓ 복사됨!' : '코드 복사'}
              </button>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="text-sm font-medium"
              style={{ color: '#7B4A2D' }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
