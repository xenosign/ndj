'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { useBackClose } from '@/hooks/useBackClose';

export default function InviteModal({ inviteCode }: { inviteCode: string }) {
  const [open, setOpen] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useBackClose(open, () => setOpen(false));

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/diet/join/${inviteCode}`);
  }, [inviteCode]);

  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full h-14 rounded-2xl font-bold text-sm transition-opacity active:opacity-70"
        style={{ backgroundColor: '#C4A0E8', color: '#1A0A3D' }}
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
            style={{ backgroundColor: '#F8F4FF' }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="w-10 h-1 rounded-full cursor-pointer"
              style={{ backgroundColor: '#D4C0F0' }}
              onClick={() => setOpen(false)}
            />

            <h2 className="text-lg font-bold" style={{ color: '#1A0A3D' }}>⚔️ 적들 초대하기</h2>

            {/* QR 코드 */}
            {joinUrl && (
              <div className="p-4 rounded-2xl" style={{ backgroundColor: '#F8F4FF' }}>
                <QRCode value={joinUrl} size={160} />
              </div>
            )}

            {/* 시크릿 코드 */}
            <div className="w-full flex flex-col items-center gap-3">
              <p className="text-xs font-medium" style={{ color: '#A67FD4' }}>시크릿 코드</p>
              <div
                className="w-full py-3 px-4 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#EDE0FF' }}
              >
                <span className="text-xl font-bold" style={{ color: '#7B4DBE', letterSpacing: '0.15em' }}>
                  {inviteCode}
                </span>
              </div>
              <button
                onClick={copyCode}
                className="w-full h-11 rounded-xl text-sm font-semibold transition-opacity active:opacity-70"
                style={{ backgroundColor: copied ? '#EDE0FF' : '#7B4DBE', color: copied ? '#7B4DBE' : '#F8F4FF' }}
              >
                {copied ? '✓ 복사됨!' : '코드 복사'}
              </button>
            </div>

            {/* 참여 링크 */}
            <div className="w-full flex flex-col items-center gap-3">
              <p className="text-xs font-medium" style={{ color: '#A67FD4' }}>참여 링크</p>
              <div
                className="w-full py-3 px-4 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#EDE0FF' }}
              >
                <span className="text-xs font-medium truncate" style={{ color: '#7B4DBE' }}>
                  {joinUrl}
                </span>
              </div>
              <button
                onClick={copyLink}
                className="w-full h-11 rounded-xl text-sm font-semibold transition-opacity active:opacity-70"
                style={{ backgroundColor: copiedLink ? '#EDE0FF' : '#7B4DBE', color: copiedLink ? '#7B4DBE' : '#F8F4FF' }}
              >
                {copiedLink ? '✓ 복사됨!' : '링크 복사'}
              </button>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="w-full h-11 rounded-xl text-sm font-semibold active:opacity-70"
              style={{ backgroundColor: '#EDE0FF', color: '#7B4DBE' }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
