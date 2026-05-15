'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import ScrollableArea from '@/components/layout/ScrollableArea';
import TopHeader from '@/components/layout/TopHeader';
import JoinChallengeSheet from '@/components/diet/JoinChallengeSheet';

type Challenge = {
  id: string;
  title: string;
  start_weight: number;
  target_weight: number;
  target_date: string;
  user_id: string;
  nickname: string | null;
  currentWeight: number;
};

function CardSkeleton({ isOdd }: { isOdd: boolean }) {
  const bg = isOdd ? '#7B4DBE' : '#F8F4FF';
  const shadow = isOdd
    ? '0 4px 24px rgba(26,10,61,0.35)'
    : '0 4px 20px rgba(123,77,190,0.28)';
  const barBg = isOdd ? 'rgba(255,255,255,0.2)' : '#D4C0F0';

  return (
    <div
      className="w-full rounded-2xl px-5 py-4 flex flex-col gap-3 animate-pulse"
      style={{ backgroundColor: bg, boxShadow: shadow }}
    >
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 rounded-full" style={{ backgroundColor: barBg }} />
        <div className="h-5 w-14 rounded-full" style={{ backgroundColor: barBg }} />
      </div>
      <div className="h-4 w-2/3 rounded-full" style={{ backgroundColor: barBg }} />
      <div className="flex items-center justify-between">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1 items-center">
            <div className="h-2.5 w-8 rounded-full" style={{ backgroundColor: barBg }} />
            <div className="h-4 w-12 rounded-full" style={{ backgroundColor: barBg }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#F8F4FF' }}>
      <TopHeader title="적들의 다이어트" showBack={false} />
      <ScrollableArea>
        <div className="px-4 py-5 flex flex-col gap-3 pb-8">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} isOdd={i % 2 === 0} />
          ))}
        </div>
      </ScrollableArea>
    </main>
  );
}

function ChallengeCard({ challenge, index }: { challenge: Challenge; index: number }) {
  const daysLeft = Math.ceil(
    (new Date(challenge.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const expired = daysLeft <= 0;
  const diff = +(challenge.currentWeight - challenge.target_weight).toFixed(1);
  const isOdd = index % 2 === 0;

  const cardContent = isOdd ? (
    <div
      className="w-full rounded-2xl px-5 py-4 flex flex-col gap-3"
      style={{ backgroundColor: '#7B4DBE', boxShadow: '0 4px 24px rgba(26,10,61,0.35)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
          ⚔️ {challenge.nickname ?? '알 수 없음'}
        </p>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#F8F4FF' }}
        >
          {expired ? `+${Math.abs(daysLeft)}일 초과` : `D-${daysLeft}`}
        </span>
      </div>
      <p className="text-sm font-bold truncate" style={{ color: '#F8F4FF' }}>
        {challenge.title}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>시작</p>
          <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>{challenge.start_weight}kg</p>
        </div>
        <div className="flex flex-col gap-0.5 items-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>목표</p>
          <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>{challenge.target_weight}kg</p>
        </div>
        <div className="flex flex-col gap-0.5 items-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>현재</p>
          <p className="text-xl font-extrabold" style={{ color: '#1A0A3D' }}>{challenge.currentWeight}kg</p>
        </div>
        <div className="flex flex-col gap-0.5 items-end">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{diff <= 0 ? '목표 달성' : '목표까지'}</p>
          <p className="text-sm font-bold" style={{ color: diff <= 0 ? '#A8E6A3' : 'rgba(255,255,255,0.85)' }}>
            {diff <= 0 ? `-${Math.abs(diff)}kg 😄` : `${diff}kg`}
          </p>
        </div>
      </div>
    </div>
  ) : (
    <div
      className="w-full rounded-2xl px-5 py-4 flex flex-col gap-3"
      style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: '#A67FD4' }}>
          ⚔️ {challenge.nickname ?? '알 수 없음'}
        </p>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: '#EDE0FF', color: '#7B4DBE' }}
        >
          {expired ? `+${Math.abs(daysLeft)}일 초과` : `D-${daysLeft}`}
        </span>
      </div>
      <p className="text-sm font-bold truncate" style={{ color: '#1A0A3D' }}>
        {challenge.title}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-xs" style={{ color: '#A67FD4' }}>시작</p>
          <p className="text-sm font-bold" style={{ color: '#7B4DBE' }}>{challenge.start_weight}kg</p>
        </div>
        <div className="flex flex-col gap-0.5 items-center">
          <p className="text-xs" style={{ color: '#A67FD4' }}>목표</p>
          <p className="text-sm font-bold" style={{ color: '#7B4DBE' }}>{challenge.target_weight}kg</p>
        </div>
        <div className="flex flex-col gap-0.5 items-center">
          <p className="text-xs" style={{ color: '#A67FD4' }}>현재</p>
          <p className="text-xl font-extrabold" style={{ color: '#4A2B8A' }}>{challenge.currentWeight}kg</p>
        </div>
        <div className="flex flex-col gap-0.5 items-end">
          <p className="text-xs" style={{ color: '#A67FD4' }}>{diff <= 0 ? '목표 달성' : '목표까지'}</p>
          <p className="text-sm font-bold" style={{ color: diff <= 0 ? '#4CAF50' : '#7B4DBE' }}>
            {diff <= 0 ? `-${Math.abs(diff)}kg 😄` : `${diff}kg`}
          </p>
        </div>
      </div>
    </div>
  );

  if (expired) {
    return (
      <div className="relative pointer-events-none">
        <div style={{ opacity: 0.5 }}>{cardContent}</div>
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>
          <p
            className="text-2xl font-black tracking-widest border-4 px-4 py-1 rounded-lg"
            style={{
              color: '#E53935',
              borderColor: '#E53935',
              transform: 'rotate(-15deg)',
              opacity: 0.85,
              textShadow: '0 1px 2px rgba(0,0,0,0.15)',
            }}
          >
            기한 초과
          </p>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/diet/enemies/${challenge.id}`} className="block active:opacity-75">
      {cardContent}
    </Link>
  );
}

export default function EnemiesPageClient({ userId }: { userId: string }) {
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchAll() {
      const { data: participants } = await supabase
        .from('diet_participants')
        .select('challenge_id')
        .eq('user_id', userId);

      const challengeIds = (participants ?? []).map(p => p.challenge_id as string);

      if (challengeIds.length === 0) {
        setChallenges([]);
        return;
      }

      const [
        { data: challengeRows },
        { data: latestLogs },
      ] = await Promise.all([
        supabase
          .from('diet_challenges')
          .select('id, title, start_weight, target_weight, target_date, user_id')
          .in('id', challengeIds),
        supabase
          .from('diet_daily_logs')
          .select('challenge_id, weight, logged_date')
          .in('challenge_id', challengeIds)
          .order('logged_date', { ascending: false }),
      ]);

      const ownerIds = [...new Set((challengeRows ?? []).map(c => c.user_id as string))];
      const { data: profileRows } = ownerIds.length > 0
        ? await supabase.from('profiles').select('id, nickname').in('id', ownerIds)
        : { data: [] };

      const nicknameMap = Object.fromEntries(
        (profileRows ?? []).map(p => [p.id as string, p.nickname as string | null])
      );

      const currentWeightMap: Record<string, number> = {};
      for (const log of (latestLogs ?? [])) {
        const cid = log.challenge_id as string;
        if (!(cid in currentWeightMap)) currentWeightMap[cid] = log.weight as number;
      }

      const sorted = ([...(challengeRows ?? [])] as {
        id: string; title: string; start_weight: number;
        target_weight: number; target_date: string; user_id: string;
      }[])
        .map(c => ({
          ...c,
          _daysLeft: Math.ceil(
            (new Date(c.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ),
        }))
        .sort((a, b) => {
          const aExpired = a._daysLeft <= 0;
          const bExpired = b._daysLeft <= 0;
          if (aExpired !== bExpired) return aExpired ? 1 : -1;
          return a._daysLeft - b._daysLeft;
        })
        .map(({ _daysLeft: _, ...c }) => ({
          ...c,
          nickname: nicknameMap[c.user_id] ?? null,
          currentWeight: currentWeightMap[c.id] ?? c.start_weight,
        }));

      setChallenges(sorted);
    }

    fetchAll();
  }, [userId]);

  if (challenges === null) return <Skeleton />;

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#F8F4FF' }}>
      <TopHeader title="적들의 다이어트" showBack={false} />

      <ScrollableArea>
        <div className="px-4 py-5 flex flex-col gap-3 pb-8">
          {challenges.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-5 py-20">
              <span className="text-5xl">⚔️</span>
              <p className="text-sm font-medium text-center" style={{ color: '#A67FD4' }}>
                참여 중인 다이어트가 없습니다.
              </p>
              <JoinChallengeSheet />
            </div>
          ) : (
            <>
              {challenges.map((challenge, index) => (
                <ChallengeCard key={challenge.id} challenge={challenge} index={index} />
              ))}
              <JoinChallengeSheet />
            </>
          )}
        </div>
      </ScrollableArea>
    </main>
  );
}
