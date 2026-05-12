'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LeaveChallengeButton({ challengeId }: { challengeId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLeave() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    await supabase
      .from('diet_participants')
      .delete()
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id);
    router.push('/diet/enemies');
  }

  if (confirm) {
    return (
      <div
        className="rounded-2xl px-5 py-4 flex flex-col gap-3"
        style={{ backgroundColor: '#FFF5F5' }}
      >
        <p className="text-sm font-semibold text-center" style={{ color: '#F44336' }}>
          정말 탈퇴하시겠습니까?
        </p>
        <p className="text-xs text-center" style={{ color: '#A67FD4' }}>
          탈퇴 시 이 챌린지에 남긴 반응과 댓글이 모두 삭제됩니다.
        </p>
        <div className="flex gap-3 mt-1">
          <button
            onClick={() => setConfirm(false)}
            className="flex-1 h-11 rounded-xl text-sm font-semibold active:opacity-70"
            style={{ backgroundColor: '#EDE0FF', color: '#7B4DBE' }}
          >
            취소
          </button>
          <button
            onClick={handleLeave}
            disabled={loading}
            className="flex-1 h-11 rounded-xl text-sm font-bold active:opacity-70 disabled:opacity-50"
            style={{ backgroundColor: '#F44336', color: '#F8F4FF' }}
          >
            {loading ? '탈퇴 중...' : '탈퇴'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="w-full h-11 rounded-xl text-sm font-semibold active:opacity-70"
      style={{ backgroundColor: '#F44336', color: '#F8F4FF' }}
    >
      🏳️ 챌린지 탈퇴하기
    </button>
  );
}
