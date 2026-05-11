'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { notifyUser } from '@/lib/notify';

const CHARACTERS = [
  { id: 'char_1', name: '불꽃전사' },
  { id: 'char_2', name: '얼음마법사' },
  { id: 'char_3', name: '번개닌자' },
  { id: 'char_4', name: '독수리기사' },
  { id: 'char_5', name: '황금용사' },
  { id: 'char_6', name: '어둠자객' },
];

function CharacterCard({
  char,
  selected,
  onSelect,
}: {
  char: (typeof CHARACTERS)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="flex flex-col items-center gap-2 rounded-2xl py-3 transition-all active:opacity-75"
      style={{
        backgroundColor: selected ? '#4A2B8A' : '#2A1560',
        border: `2px solid ${selected ? '#C4A0E8' : 'transparent'}`,
      }}
    >
      <div
        className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: '#1A0A3D' }}
      >
        <Image
          src={`/characters/${char.id}.png`}
          alt={char.name}
          width={64}
          height={64}
          className="object-cover"
          onError={(e) => {
            // 이미지 없을 때 이니셜 표시
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent && !parent.querySelector('span')) {
              const span = document.createElement('span');
              span.textContent = char.name[0];
              span.style.cssText = 'font-size:24px;font-weight:800;color:#C4A0E8;';
              parent.appendChild(span);
            }
          }}
        />
      </div>
      <span
        className="text-xs font-semibold"
        style={{ color: selected ? '#C4A0E8' : '#A67FD4' }}
      >
        {char.name}
      </span>
    </button>
  );
}

export default function JoinButton({
  challengeId,
  challengeOwnerId,
}: {
  challengeId: string;
  challengeOwnerId: string;
}) {
  const router = useRouter();
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    if (!selectedChar) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { error: insertErr } = await supabase.from('diet_participants').insert({
      challenge_id: challengeId,
      user_id: user.id,
      character: selectedChar,
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

    router.push('/diet/enemies');
  }

  return (
    <div className="w-full flex flex-col gap-5">
      {/* 캐릭터 선택 */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold" style={{ color: '#D4C0F0' }}>
          캐릭터를 선택하세요
        </p>
        <div className="grid grid-cols-3 gap-3">
          {CHARACTERS.map((char) => (
            <CharacterCard
              key={char.id}
              char={char}
              selected={selectedChar === char.id}
              onSelect={() => setSelectedChar(char.id)}
            />
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-center" style={{ color: '#C4A0E8' }}>
          {error}
        </p>
      )}

      <button
        onClick={handleJoin}
        disabled={!selectedChar || loading}
        className="w-full h-14 rounded-xl font-bold text-base transition-opacity active:opacity-70 disabled:opacity-40"
        style={{ backgroundColor: '#C4A0E8', color: '#1A0A3D' }}
      >
        {loading ? '참여 중...' : '⚔️ 적으로 참여하기'}
      </button>
    </div>
  );
}
