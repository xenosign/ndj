'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { notifyUser } from '@/lib/notify';

interface Props {
  hasPhoto: boolean;
  signedUrl: string | null;
  challengeId: string;
  challengeOwnerId: string;
}

export default function EnemyPhotoButton({ hasPhoto, signedUrl, challengeId, challengeOwnerId }: Props) {
  const [viewOpen, setViewOpen] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const storageKey = `photo-requested:${challengeId}:${today}`;
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    setRequested(localStorage.getItem(storageKey) === '1');
  }, [storageKey]);

  async function handleRequest() {
    localStorage.setItem(storageKey, '1');
    setRequested(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
    const nickname = profile?.nickname ?? '누군가';
    notifyUser({
      targetUserId: challengeOwnerId,
      title: '체중 사진 요청 📣',
      body: `${nickname}님이 오늘의 체중 사진을 요청했습니다!`,
      url: '/diet/my',
    });
  }

  if (!hasPhoto) {
    return (
      <button
        onClick={requested ? undefined : handleRequest}
        className="w-full h-11 rounded-xl text-sm font-semibold transition-opacity active:opacity-70"
        style={{
          backgroundColor: requested ? '#F5F5FA' : '#EDEAFF',
          color: requested ? '#9898A6' : '#7B6EF6',
        }}
      >
        {requested ? '📣 사진 요청 완료' : '📣 체중 사진 요청하기'}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setViewOpen(true)}
        className="w-full h-11 rounded-xl text-sm font-semibold active:opacity-70"
        style={{ backgroundColor: '#EDEAFF', color: '#7B6EF6' }}
      >
        📷 오늘 체중 사진 보기
      </button>

      {viewOpen && signedUrl && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setViewOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl flex flex-col"
            style={{ backgroundColor: '#FFFFFF', maxHeight: '85dvh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-3 shrink-0">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: '#EBEBF5' }} />
              <h2 className="text-base font-bold" style={{ color: '#1A1A2E' }}>적의 오늘 체중 사진</h2>
            </div>
            <div className="overflow-y-auto px-6">
              <div className="w-full rounded-2xl overflow-hidden">
                <img src={signedUrl} alt="적의 체중 사진" className="w-full h-auto" />
              </div>
            </div>
            <div className="px-6 pt-4 pb-10 shrink-0">
              <button
                onClick={() => setViewOpen(false)}
                className="w-full h-12 rounded-xl font-bold text-sm"
                style={{ backgroundColor: '#F7F7FC', color: '#1A1A2E' }}
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
