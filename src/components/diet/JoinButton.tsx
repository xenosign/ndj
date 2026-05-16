'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { notifyUser } from '@/lib/notify';

type ParticipantType = 'kakao' | 'nickname' | 'anonymous';

const PROFILE_OPTIONS: { value: ParticipantType; label: string }[] = [
  { value: 'kakao', label: '카카오 프로필' },
  { value: 'nickname', label: '기본 닉네임' },
  { value: 'anonymous', label: '익명으로 참여' },
];

export default function JoinButton({
  challengeId,
  challengeOwnerId,
}: {
  challengeId: string;
  challengeOwnerId: string;
}) {
  const router = useRouter();
  const [participantType, setParticipantType] = useState<ParticipantType | null>(null);
  const [anonymousName, setAnonymousName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canJoin =
    participantType === 'kakao' ||
    participantType === 'nickname' ||
    (participantType === 'anonymous' && anonymousName.trim().length > 0);

  async function handleJoin() {
    if (!canJoin) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const characterValue =
      participantType === 'anonymous' ? anonymousName.trim() : participantType!;

    const { error: insertErr } = await supabase.from('diet_participants').insert({
      challenge_id: challengeId,
      user_id: user.id,
      character: characterValue,
    });

    if (insertErr) {
      setError('참여 중 오류가 발생했습니다.');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single();
    const nickname = profile?.nickname ?? '누군가';
    notifyUser({
      targetUserId: challengeOwnerId,
      title: '새로운 적이 나타났어요 ⚔️',
      body: `${nickname}님이 회원님의 챌린지에 참전했습니다!`,
      url: '/diet/my',
    });

    router.push(`/diet/enemies/${challengeId}`);
  }

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold" style={{ color: '#D4C0F0' }}>
          아바타 선택
        </p>
        <div className="flex gap-2">
          {PROFILE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setParticipantType(opt.value)}
              className="flex-1 h-11 rounded-xl text-xs font-semibold transition-all active:opacity-75"
              style={{
                backgroundColor: participantType === opt.value ? '#7B4DBE' : '#2A1560',
                color: participantType === opt.value ? '#F8F4FF' : '#A67FD4',
                border: `2px solid ${participantType === opt.value ? '#C4A0E8' : 'transparent'}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {participantType === 'anonymous' && (
          <input
            type="text"
            maxLength={20}
            placeholder="익명 이름을 입력하세요"
            value={anonymousName}
            onChange={e => setAnonymousName(e.target.value)}
            className="w-full h-12 px-4 rounded-xl text-sm outline-none border"
            style={{ backgroundColor: '#2A1560', color: '#EDE0FF', borderColor: '#4A2B8A' }}
            autoFocus
          />
        )}
      </div>

      {error && (
        <p className="text-sm text-center" style={{ color: '#C4A0E8' }}>
          {error}
        </p>
      )}

      <button
        onClick={handleJoin}
        disabled={!canJoin || loading}
        className="w-full h-14 rounded-xl font-bold text-base transition-opacity active:opacity-70 disabled:opacity-40"
        style={{ backgroundColor: '#C4A0E8', color: '#1A0A3D' }}
      >
        {loading ? '참여 중...' : '⚔️ 적으로 참여하기'}
      </button>
    </div>
  );
}
