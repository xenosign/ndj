'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { notifyUser } from '@/lib/notify';

interface Props {
  challengeId: string;
  challengeOwnerId: string;
  initialBoomUp: number;
  initialBoomDown: number;
  myVote: boolean | null;
}

export default function BoomVoteButtons({
  challengeId, challengeOwnerId, initialBoomUp, initialBoomDown, myVote,
}: Props) {
  const [voted, setVoted] = useState<boolean | null>(myVote);
  const [boomUp, setBoomUp] = useState(initialBoomUp);
  const [boomDown, setBoomDown] = useState(initialBoomDown);
  const [loading, setLoading] = useState(false);

  async function handleVote(isBoomUp: boolean) {
    if (loading) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    await supabase.from('diet_booms').delete()
      .eq('challenge_id', challengeId).eq('user_id', user.id);

    if (voted === isBoomUp) {
      if (isBoomUp) setBoomUp(v => v - 1);
      else setBoomDown(v => v - 1);
      setVoted(null);
    } else {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('diet_booms').insert({
        challenge_id: challengeId, user_id: user.id, voted_date: today, is_boom_up: isBoomUp,
      });
      if (voted !== null) {
        if (voted) setBoomUp(v => v - 1);
        else setBoomDown(v => v - 1);
      }
      if (isBoomUp) setBoomUp(v => v + 1);
      else setBoomDown(v => v + 1);
      setVoted(isBoomUp);

      const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
      const nickname = profile?.nickname ?? '누군가';
      notifyUser({
        targetUserId: challengeOwnerId,
        title: isBoomUp ? '붐업을 받았어요 👍' : '붐다운을 받았어요 👎',
        body: `${nickname}님이 회원님의 다이어트에 ${isBoomUp ? '붐업' : '붐다운'}했습니다!`,
        url: '/diet/my',
      });
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-3">
      {/* 붐업 */}
      <button
        onClick={() => handleVote(true)}
        disabled={loading}
        className="flex-1 flex flex-col items-center py-4 gap-1 rounded-2xl transition-all active:opacity-70"
        style={{
          backgroundColor: voted === true ? '#7B4DBE' : '#F8F4FF',
          boxShadow: '0 4px 20px rgba(123,77,190,0.28)',
          opacity: voted === false ? 0.5 : 1,
        }}
      >
        <span className="text-xl">👍</span>
        <span className="text-xl font-bold" style={{ color: voted === true ? '#F8F4FF' : '#1A0A3D' }}>
          {boomUp.toLocaleString()}
        </span>
        <span className="text-xs font-medium" style={{ color: voted === true ? '#EDE0FF' : '#A67FD4' }}>
          {voted === true ? '✓ 붐업' : '붐업'}
        </span>
      </button>

      {/* 붐다운 */}
      <button
        onClick={() => handleVote(false)}
        disabled={loading}
        className="flex-1 flex flex-col items-center py-4 gap-1 rounded-2xl transition-all active:opacity-70"
        style={{
          backgroundColor: voted === false ? '#FF6B6B' : '#F8F4FF',
          boxShadow: '0 4px 20px rgba(123,77,190,0.28)',
          opacity: voted === true ? 0.5 : 1,
        }}
      >
        <span className="text-xl">👎</span>
        <span className="text-xl font-bold" style={{ color: voted === false ? '#F8F4FF' : '#1A0A3D' }}>
          {boomDown.toLocaleString()}
        </span>
        <span className="text-xs font-medium" style={{ color: voted === false ? '#FFE0E0' : '#A67FD4' }}>
          {voted === false ? '✓ 붐다운' : '붐다운'}
        </span>
      </button>
    </div>
  );
}
