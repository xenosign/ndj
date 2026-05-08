import ScrollableArea from '@/components/layout/ScrollableArea';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TopHeader from '@/components/layout/TopHeader';


export default async function EnemiesDietPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 1단계: 내가 참여 중인 challenge_id 목록
  const { data: participants } = await supabase
    .from('diet_participants')
    .select('challenge_id')
    .eq('user_id', user.id);

  const challengeIds = (participants ?? []).map(p => p.challenge_id as string);

  // 2단계: 챌린지 상세 조회
  const { data: challengeRows } = challengeIds.length > 0
    ? await supabase
        .from('diet_challenges')
        .select('id, title, start_weight, target_weight, target_date, user_id')
        .in('id', challengeIds)
    : { data: [] };

  // 3단계: 챌린지 소유자 닉네임 조회
  const ownerIds = [...new Set((challengeRows ?? []).map(c => c.user_id as string))];
  const { data: profileRows } = ownerIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, nickname')
        .in('id', ownerIds)
    : { data: [] };

  const nicknameMap = Object.fromEntries(
    (profileRows ?? []).map(p => [p.id as string, p.nickname as string | null])
  );

  // 4단계: 각 챌린지의 최신 체중 조회
  const { data: latestLogs } = challengeIds.length > 0
    ? await supabase
        .from('diet_daily_logs')
        .select('challenge_id, weight, logged_date')
        .in('challenge_id', challengeIds)
        .order('logged_date', { ascending: false })
    : { data: [] };

  const currentWeightMap: Record<string, number> = {};
  for (const log of (latestLogs ?? [])) {
    const cid = log.challenge_id as string;
    if (!(cid in currentWeightMap)) {
      currentWeightMap[cid] = log.weight as number;
    }
  }

  const challenges = (challengeRows ?? []) as {
    id: string;
    title: string;
    start_weight: number;
    target_weight: number;
    target_date: string;
    user_id: string;
  }[];

  const LABEL_COLOR = '#E8D5B0';

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#2C1A0E' }}>
      <TopHeader title="적들의 다이어트" />

      <ScrollableArea>
      <div className="px-6 py-6 flex flex-col gap-4">

        {challenges.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <p className="text-4xl">⚔️</p>
            <p className="text-base font-semibold text-center" style={{ color: LABEL_COLOR }}>
              참여 중인 다이어트가 없습니다.
            </p>
            <Link
              href="/diet/join"
              className="px-6 py-3 rounded-full text-sm font-bold transition-opacity hover:opacity-85 active:opacity-70"
              style={{ backgroundColor: '#C47B3A', color: '#FAFAF7' }}
            >
              적 다이어트 참여하기
            </Link>
          </div>
        ) : (
          <>
            {challenges.map(challenge => {
              const daysLeft = Math.ceil(
                (new Date(challenge.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const nickname = nicknameMap[challenge.user_id];
              return (
                <Link
                  key={challenge.id}
                  href={`/diet/enemies/${challenge.id}`}
                  className="w-full rounded-2xl p-5 flex flex-col gap-3 transition-opacity hover:opacity-85 active:opacity-70"
                  style={{ backgroundColor: '#3D2510' }}
                >
                  {nickname && (
                    <p className="text-xs font-medium" style={{ color: '#7B4A2D' }}>
                      {nickname}
                    </p>
                  )}
                  <h2 className="text-base font-bold" style={{ color: '#F2C14E' }}>
                    {challenge.title}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-sm font-semibold px-3 py-1 rounded-full"
                      style={{ backgroundColor: '#7B4A2D', color: '#F2C14E' }}
                    >
                      D - {daysLeft}일
                    </span>
                    <span className="text-sm font-medium" style={{ color: LABEL_COLOR }}>
                      현재 {currentWeightMap[challenge.id] ?? challenge.start_weight}kg · 목표 {challenge.target_weight}kg
                    </span>
                  </div>
                </Link>
              );
            })}

            <Link
              href="/diet/join"
              className="w-full h-13 rounded-xl font-bold text-sm flex items-center justify-center transition-opacity hover:opacity-85 active:opacity-70"
              style={{ backgroundColor: '#3D2510', color: '#E8D5B0' }}
            >
              + 적 추가하기
            </Link>
          </>
        )}
      </div>
      </ScrollableArea>
    </main>
  );
}
