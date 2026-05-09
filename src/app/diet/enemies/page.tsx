import ScrollableArea from '@/components/layout/ScrollableArea';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TopHeader from '@/components/layout/TopHeader';

export default async function EnemiesDietPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: participants } = await supabase
    .from('diet_participants')
    .select('challenge_id')
    .eq('user_id', user.id);

  const challengeIds = (participants ?? []).map(p => p.challenge_id as string);

  const { data: challengeRows } = challengeIds.length > 0
    ? await supabase
        .from('diet_challenges')
        .select('id, title, start_weight, target_weight, target_date, user_id')
        .in('id', challengeIds)
    : { data: [] };

  const ownerIds = [...new Set((challengeRows ?? []).map(c => c.user_id as string))];
  const { data: profileRows } = ownerIds.length > 0
    ? await supabase.from('profiles').select('id, nickname').in('id', ownerIds)
    : { data: [] };

  const nicknameMap = Object.fromEntries(
    (profileRows ?? []).map(p => [p.id as string, p.nickname as string | null])
  );

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
    if (!(cid in currentWeightMap)) currentWeightMap[cid] = log.weight as number;
  }

  const challenges = (challengeRows ?? []) as {
    id: string; title: string; start_weight: number;
    target_weight: number; target_date: string; user_id: string;
  }[];

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#F7F7FC' }}>
      <TopHeader title="적들의 다이어트" showBack={false} />

      <ScrollableArea>
        <div className="px-4 py-5 flex flex-col gap-3 pb-8">

          {challenges.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-5 py-20">
              <span className="text-5xl">⚔️</span>
              <p className="text-sm font-medium text-center" style={{ color: '#9898A6' }}>
                참여 중인 다이어트가 없습니다.
              </p>
              <Link
                href="/diet/join"
                className="px-6 py-3 rounded-full text-sm font-bold"
                style={{ backgroundColor: '#7B6EF6', color: '#FFFFFF' }}
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
                const currentWeight = currentWeightMap[challenge.id] ?? challenge.start_weight;
                const totalChange = challenge.start_weight - challenge.target_weight;
                const currentChange = challenge.start_weight - currentWeight;
                const progress = totalChange > 0
                  ? Math.min(100, Math.max(0, Math.round((currentChange / totalChange) * 100)))
                  : 0;

                return (
                  <Link
                    key={challenge.id}
                    href={`/diet/enemies/${challenge.id}`}
                    className="w-full rounded-2xl p-5 flex flex-col gap-3 active:opacity-70"
                    style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(123,110,246,0.08)' }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold" style={{ color: '#9898A6' }}>
                        {nickname ?? '알 수 없음'}
                      </p>
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: '#EDEAFF', color: '#7B6EF6' }}
                      >
                        D-{daysLeft}일
                      </span>
                    </div>

                    <p className="text-sm font-bold" style={{ color: '#1A1A2E' }}>
                      {challenge.title}
                    </p>

                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs" style={{ color: '#9898A6' }}>
                          현재 {currentWeight}kg
                        </span>
                        <span className="text-xs font-semibold" style={{ color: '#7B6EF6' }}>
                          {progress}%
                        </span>
                        <span className="text-xs" style={{ color: '#9898A6' }}>
                          목표 {challenge.target_weight}kg
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#EDEAFF' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${progress}%`, backgroundColor: '#7B6EF6' }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}

              <Link
                href="/diet/join"
                className="w-full h-13 rounded-2xl font-bold text-sm flex items-center justify-center border-2 active:opacity-70"
                style={{ borderColor: '#EBEBF5', color: '#9898A6', backgroundColor: '#FFFFFF' }}
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
