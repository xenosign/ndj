'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { notifyUser } from '@/lib/notify';

export default function JoinButton({ challengeId, challengeOwnerId }: { challengeId: string; challengeOwnerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { error: insertErr } = await supabase
      .from('diet_participants')
      .insert({ challenge_id: challengeId, user_id: user.id });

    if (insertErr) {
      setError('참여 중 오류가 발생했습니다.');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
    const nickname = profile?.nickname ?? '누군가';
    notifyUser({
      targetUserId: challengeOwnerId,
      title: '새로운 적이 나타났어요 ⚔️',
      body: `${nickname}님이 회원님의 챌린지에 참전했습니다!`,
      url: '/diet/my',
    });

    router.push('/diet/enemies');
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {error && (
        <p className="text-sm text-center" style={{ color: '#F5A58A' }}>{error}</p>
      )}
      <button
        onClick={handleJoin}
        disabled={loading}
        className="w-full h-14 rounded-xl font-bold text-base transition-opacity hover:opacity-85 active:opacity-70 disabled:opacity-50"
        style={{ backgroundColor: '#F5A58A', color: '#2C1A0E' }}
      >
        {loading ? '참여 중...' : '⚔️ 적으로 참여하기'}
      </button>
    </div>
  );
}
