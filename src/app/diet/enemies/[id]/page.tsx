import ScrollableArea from '@/components/layout/ScrollableArea';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TopHeader from '@/components/layout/TopHeader';
import BoomVoteButtons from '@/components/diet/BoomVoteButtons';
import CommentBoard from '@/components/diet/CommentBoard';
import EnemyPhotoButton from '@/components/diet/EnemyPhotoButton';

export default async function EnemyDietDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: challenge } = await supabase
    .from('diet_challenges')
    .select('id, title, start_weight, target_weight, target_date, deposit, user_id')
    .eq('id', id)
    .single();

  if (!challenge) redirect('/diet/enemies');

  const { data: participant } = await supabase
    .from('diet_participants')
    .select('id')
    .eq('challenge_id', id)
    .eq('user_id', user.id)
    .single();

  if (!participant) redirect('/diet/enemies');

  // 적 닉네임
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', challenge.user_id)
    .single();

  const today = new Date().toISOString().split('T')[0];

  const { data: latestLog } = await supabase
    .from('diet_daily_logs')
    .select('weight, logged_date, photo_url')
    .eq('challenge_id', id)
    .order('logged_date', { ascending: false })
    .limit(1)
    .single();

  const currentWeight: number = latestLog?.weight ?? challenge.start_weight;
  const todayPhotoPath: string | null =
    latestLog?.logged_date === today ? (latestLog.photo_url as string | null) : null;

  let todayPhotoSignedUrl: string | null = null;
  if (todayPhotoPath) {
    const { data: signedData } = await supabase.storage
      .from('diet-photos')
      .createSignedUrl(todayPhotoPath, 3600);
    todayPhotoSignedUrl = signedData?.signedUrl ?? null;
  }

  const { data: booms } = await supabase
    .from('diet_booms')
    .select('is_boom_up')
    .eq('challenge_id', id);

  const boomUp = booms?.filter(b => b.is_boom_up).length ?? 0;
  const boomDown = booms?.filter(b => !b.is_boom_up).length ?? 0;

  const { data: myVoteRow } = await supabase
    .from('diet_booms')
    .select('is_boom_up')
    .eq('challenge_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const myVote: boolean | null = myVoteRow ? (myVoteRow.is_boom_up as boolean) : null;

  const daysLeft = Math.ceil(
    (new Date(challenge.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const startWeight = challenge.start_weight as number;
  const targetWeight = challenge.target_weight as number;
  const diff = +(targetWeight - currentWeight).toFixed(1);
  const totalChange = startWeight - targetWeight;
  const currentChange = startWeight - currentWeight;
  const progress = totalChange > 0
    ? Math.min(100, Math.max(0, Math.round((currentChange / totalChange) * 100)))
    : 0;

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#F7F7FC' }}>
      <TopHeader title={ownerProfile?.nickname ?? '적의 다이어트'} backHref="/diet/enemies" />

      <ScrollableArea>
        <div className="px-4 py-5 flex flex-col gap-4 pb-8">

          {/* 챌린지 타이틀 카드 */}
          <div
            className="rounded-2xl px-5 py-4 flex flex-col gap-3"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(123,110,246,0.08)' }}
          >
            <p className="text-base font-bold" style={{ color: '#1A1A2E' }}>{challenge.title as string}</p>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: '#EDEAFF', color: '#7B6EF6' }}
              >
                D-{daysLeft}일
              </span>
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: '#F5F5FA', color: '#9898A6' }}
              >
                💰 {(challenge.deposit as number).toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 체중 현황 카드 */}
          <div
            className="rounded-2xl px-5 py-5 flex flex-col gap-4"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(123,110,246,0.08)' }}
          >
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: '#9898A6' }}>현재 체중</p>
                <p className="font-extrabold leading-none" style={{ color: '#1A1A2E', fontSize: '48px' }}>
                  {currentWeight}
                  <span className="text-lg font-semibold ml-1" style={{ color: '#9898A6' }}>kg</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium mb-1" style={{ color: '#9898A6' }}>목표까지</p>
                <p className="text-2xl font-bold" style={{ color: diff <= 0 ? '#4CAF50' : '#7B6EF6' }}>
                  {diff > 0 ? `${diff}kg` : `${Math.abs(diff)}kg ✓`}
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs" style={{ color: '#9898A6' }}>시작 {startWeight}kg</span>
                <span className="text-xs font-semibold" style={{ color: '#7B6EF6' }}>{progress}%</span>
                <span className="text-xs" style={{ color: '#9898A6' }}>목표 {targetWeight}kg</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#EDEAFF' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progress}%`, backgroundColor: '#7B6EF6' }}
                />
              </div>
            </div>

            {/* 사진 버튼 */}
            <EnemyPhotoButton
              hasPhoto={!!todayPhotoPath}
              signedUrl={todayPhotoSignedUrl}
              challengeId={challenge.id}
              challengeOwnerId={challenge.user_id as string}
            />
          </div>

          {/* 붐업 / 붐다운 */}
          <BoomVoteButtons
            challengeId={challenge.id}
            challengeOwnerId={challenge.user_id as string}
            initialBoomUp={boomUp}
            initialBoomDown={boomDown}
            myVote={myVote}
          />

          {/* 댓글 */}
          <CommentBoard
            challengeId={challenge.id}
            challengeOwnerId={challenge.user_id as string}
            buttonLabel="💬 적에게 댓글 달기"
            placeholder="적에게 한마디..."
          />

        </div>
      </ScrollableArea>
    </main>
  );
}
