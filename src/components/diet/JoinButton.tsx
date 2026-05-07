'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function JoinButton({ challengeId }: { challengeId: string }) {
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
    router.push('/home');
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
