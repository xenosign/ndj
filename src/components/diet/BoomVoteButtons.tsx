'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  challengeId: string;
  initialBoomUp: number;
  initialBoomDown: number;
  myVote: boolean | null; // true=붐업, false=붐다운, null=미투표
}

export default function BoomVoteButtons({
  challengeId,
  initialBoomUp,
  initialBoomDown,
  myVote,
}: Props) {
  const [voted, setVoted] = useState<boolean | null>(myVote);
  const [boomUp, setBoomUp] = useState(initialBoomUp);
  const [boomDown, setBoomDown] = useState(initialBoomDown);
  const [loading, setLoading] = useState(false);

  const LABEL_COLOR = '#E8D5B0';

  async function handleVote(isBoomUp: boolean) {
    if (loading) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // 기존 투표 삭제
    await supabase
      .from('diet_booms')
      .delete()
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id);

    if (voted === isBoomUp) {
      // 같은 버튼 재클릭 → 투표 취소
      if (isBoomUp) setBoomUp(v => v - 1);
      else setBoomDown(v => v - 1);
      setVoted(null);
    } else {
      // 다른 버튼 클릭 or 새 투표
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('diet_booms').insert({
        challenge_id: challengeId,
        user_id: user.id,
        voted_date: today,
        is_boom_up: isBoomUp,
      });
      if (voted !== null) {
        // 반대 투표로 변경 → 이전 카운트 차감
        if (voted) setBoomUp(v => v - 1);
        else setBoomDown(v => v - 1);
      }
      if (isBoomUp) setBoomUp(v => v + 1);
      else setBoomDown(v => v + 1);
      setVoted(isBoomUp);
    }
    setLoading(false);
  }

  return (
    <div className="flex rounded-2xl overflow-hidden" style={{ backgroundColor: '#3D2510' }}>
      {/* 붐업 */}
      <button
        onClick={() => handleVote(true)}
        disabled={loading}
        className="flex-1 flex flex-col items-center py-4 gap-1 transition-opacity active:opacity-70"
        style={{
          opacity: voted === false ? 0.45 : 1,
          backgroundColor: voted === true ? '#4A2E18' : undefined,
        }}
      >
        <span className="text-xs font-medium" style={{ color: LABEL_COLOR }}>
          {voted === true ? '✅ 붐업' : '붐업 👍'}
        </span>
        <span className="text-2xl font-bold" style={{ color: '#F2C14E' }}>
          {boomUp.toLocaleString()}
        </span>
      </button>

      <div style={{ width: 1, backgroundColor: '#7B4A2D', margin: '12px 0' }} />

      {/* 붐다운 */}
      <button
        onClick={() => handleVote(false)}
        disabled={loading}
        className="flex-1 flex flex-col items-center py-4 gap-1 transition-opacity active:opacity-70"
        style={{
          opacity: voted === true ? 0.45 : 1,
          backgroundColor: voted === false ? '#4A2E18' : undefined,
        }}
      >
        <span className="text-xs font-medium" style={{ color: LABEL_COLOR }}>
          {voted === false ? '✅ 붐다운' : '붐다운 👎'}
        </span>
        <span className="text-2xl font-bold" style={{ color: '#F5A58A' }}>
          {boomDown.toLocaleString()}
        </span>
      </button>
    </div>
  );
}
