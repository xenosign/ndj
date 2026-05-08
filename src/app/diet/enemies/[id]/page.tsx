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

  // 챌린지 정보
  const { data: challenge } = await supabase
    .from('diet_challenges')
    .select('id, title, start_weight, target_weight, target_date, deposit, user_id')
    .eq('id', id)
    .single();

  if (!challenge) redirect('/diet/enemies');

  // 내가 참여자인지 확인
  const { data: participant } = await supabase
    .from('diet_participants')
    .select('id')
    .eq('challenge_id', id)
    .eq('user_id', user.id)
    .single();

  if (!participant) redirect('/diet/enemies');

  const today = new Date().toISOString().split('T')[0];

  // 최근 일일 기록에서 현재 체중 + 오늘 사진 조회
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

  // 사진 signed URL 서버에서 생성
  let todayPhotoSignedUrl: string | null = null;
  if (todayPhotoPath) {
    const { data: signedData } = await supabase.storage
      .from('diet-photos')
      .createSignedUrl(todayPhotoPath, 3600);
    todayPhotoSignedUrl = signedData?.signedUrl ?? null;
  }

  // 붐업 / 붐다운 집계
  const { data: booms } = await supabase
    .from('diet_booms')
    .select('is_boom_up')
    .eq('challenge_id', id);

  const boomUp = booms?.filter(b => b.is_boom_up).length ?? 0;
  const boomDown = booms?.filter(b => !b.is_boom_up).length ?? 0;

  // 내 투표 (날짜 무관, 최근 것)
  const { data: myVoteRow } = await supabase
    .from('diet_booms')
    .select('is_boom_up')
    .eq('challenge_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const myVote: boolean | null =
    myVoteRow ? (myVoteRow.is_boom_up as boolean) : null;

  const daysLeft = Math.ceil(
    (new Date(challenge.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const diff = +(challenge.target_weight - currentWeight).toFixed(1);
  const LABEL_COLOR = '#E8D5B0';

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#2C1A0E' }}>
      <TopHeader title="적의 다이어트" backHref="/diet/enemies" />

      <ScrollableArea>
      <div className="px-6 py-6 flex flex-col gap-6">

        {/* 예치금(좌) + D-X일(우) */}
        <div className="flex items-center justify-between">
          <span
            className="text-sm font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: '#3D2510', color: '#E8D5B0' }}
          >
            💰 {(challenge.deposit as number).toLocaleString()}원
          </span>
          <span
            className="text-sm font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: '#7B4A2D', color: '#F2C14E' }}
          >
            D - {daysLeft}일
          </span>
        </div>

        {/* 다이어트 제목 */}
        <h2 className="text-base font-bold text-center" style={{ color: '#F2C14E' }}>
          {challenge.title}
        </h2>

        {/* 목표까지 남은 체중 + 체중 사진 버튼 */}
        <div className="flex flex-col items-center gap-2 py-6">
          <p className="text-sm font-medium" style={{ color: LABEL_COLOR }}>
            목표 체중까지
          </p>
          <p
            className="font-extrabold leading-none"
            style={{ color: '#F2C14E', fontSize: '72px' }}
          >
            {diff > 0 ? `+${diff}` : diff}kg
          </p>
          <div className="mt-4">
            <EnemyPhotoButton
              hasPhoto={!!todayPhotoPath}
              signedUrl={todayPhotoSignedUrl}
              challengeId={challenge.id}
            />
          </div>
        </div>

        {/* 현재 체중 / 목표 체중 */}
        <div className="flex rounded-2xl overflow-hidden" style={{ backgroundColor: '#3D2510' }}>
          <div className="flex-1 flex flex-col items-center py-4 gap-1">
            <span className="text-xs font-medium" style={{ color: LABEL_COLOR }}>현재 체중</span>
            <span className="text-2xl font-bold" style={{ color: '#FAFAF7' }}>
              {currentWeight}
              <span className="text-sm font-normal ml-1" style={{ color: '#7B4A2D' }}>kg</span>
            </span>
          </div>
          <div style={{ width: 1, backgroundColor: '#7B4A2D', margin: '12px 0' }} />
          <div className="flex-1 flex flex-col items-center py-4 gap-1">
            <span className="text-xs font-medium" style={{ color: LABEL_COLOR }}>목표 체중</span>
            <span className="text-2xl font-bold" style={{ color: '#F2C14E' }}>
              {challenge.target_weight}
              <span className="text-sm font-normal ml-1" style={{ color: '#7B4A2D' }}>kg</span>
            </span>
          </div>
        </div>

        {/* 적에게 댓글 달기 */}
        <CommentBoard
          challengeId={challenge.id}
          challengeOwnerId={challenge.user_id as string}
          buttonLabel="🔥 적에게 댓글 달기"
          placeholder="적에게 한마디..."
        />

        {/* 붐업 / 붐다운 투표 */}
        <BoomVoteButtons
          challengeId={challenge.id}
          initialBoomUp={boomUp}
          initialBoomDown={boomDown}
          myVote={myVote}
        />

      </div>
      </ScrollableArea>
    </main>
  );
}
