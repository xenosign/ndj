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
        className="w-full h-14 rounded-2xl font-bold text-sm border-2 transition-opacity active:opacity-70"
        style={{ borderColor: '#7B6EF6', color: '#7B6EF6', backgroundColor: 'transparent' }}
      >
        ⚔️ 적들 초대하기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl px-6 pt-6 pb-10 flex flex-col items-center gap-6"
            style={{ backgroundColor: '#FFFFFF' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#EBEBF5' }} />

            <h2 className="text-lg font-bold" style={{ color: '#1A1A2E' }}>⚔️ 적들 초대하기</h2>

            {/* QR 코드 */}
            {joinUrl && (
              <div className="p-4 rounded-2xl" style={{ backgroundColor: '#F7F7FC' }}>
                <QRCode value={joinUrl} size={160} />
              </div>
            )}

            {/* 시크릿 코드 */}
            <div className="w-full flex flex-col items-center gap-3">
              <p className="text-xs font-medium" style={{ color: '#9898A6' }}>시크릿 코드</p>
              <div
                className="w-full py-3 px-4 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#F7F7FC', border: '1px solid #EBEBF5' }}
              >
                <span className="text-xl font-bold" style={{ color: '#7B6EF6', letterSpacing: '0.15em' }}>
                  {inviteCode}
                </span>
              </div>
              <button
                onClick={copyCode}
                className="h-11 px-8 rounded-xl text-sm font-semibold transition-opacity active:opacity-70"
                style={{ backgroundColor: copied ? '#EDEAFF' : '#7B6EF6', color: copied ? '#7B6EF6' : '#FFFFFF' }}
              >
                {copied ? '✓ 복사됨!' : '코드 복사'}
              </button>
            </div>

            <button onClick={() => setOpen(false)} className="text-sm font-medium" style={{ color: '#9898A6' }}>
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
