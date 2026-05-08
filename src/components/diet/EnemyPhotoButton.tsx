'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Props {
  hasPhoto: boolean;
  signedUrl: string | null;
  challengeId: string;
}

export default function EnemyPhotoButton({ hasPhoto, signedUrl, challengeId }: Props) {
  const [viewOpen, setViewOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const storageKey = `photo-requested:${challengeId}:${today}`;
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    setRequested(localStorage.getItem(storageKey) === '1');
  }, [storageKey]);

  function handleRequest() {
    localStorage.setItem(storageKey, '1');
    setRequested(true);
  }

  if (!hasPhoto) {
    return (
      <button
        onClick={requested ? undefined : handleRequest}
        className="px-5 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-85 active:opacity-70"
        style={{
          backgroundColor: requested ? '#3D2510' : '#C47B3A',
          color: requested ? '#E8D5B0' : '#FAFAF7',
        }}
      >
        {requested ? '📣 체중 사진 요청 완료' : '📣 체중 사진 요청하기'}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setViewOpen(true)}
        className="px-5 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-85 active:opacity-70"
        style={{ backgroundColor: '#3D2510', color: '#E8D5B0' }}
      >
        📷 적의 체중 사진 보기
      </button>

      {viewOpen && signedUrl && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setViewOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl flex flex-col"
            style={{ backgroundColor: '#3D2510', maxHeight: '85dvh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 핸들 + 제목 */}
            <div className="px-6 pt-5 pb-3 shrink-0">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: '#7B4A2D' }} />
              <h2 className="text-base font-bold" style={{ color: '#F2C14E' }}>적의 오늘 체중 사진</h2>
            </div>

            {/* 사진 스크롤 영역 */}
            <div className="overflow-y-auto px-6">
              <div className="w-full rounded-2xl overflow-hidden">
                <img src={signedUrl} alt="적의 체중 사진" className="w-full h-auto" />
              </div>
            </div>

            {/* 닫기 버튼 */}
            <div className="px-6 pt-4 pb-10 shrink-0">
              <button
                onClick={() => setViewOpen(false)}
                className="w-full h-12 rounded-xl font-bold text-sm transition-opacity hover:opacity-85 active:opacity-70"
                style={{ backgroundColor: '#7B4A2D', color: '#F4E6C6' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
