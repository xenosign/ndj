import ScrollableArea from '@/components/layout/ScrollableArea';
import { randomBytes } from 'crypto';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TopHeader from '@/components/layout/TopHeader';
import InviteModal from '@/components/diet/InviteModal';
import DailyLogButton from '@/components/diet/DailyLogButton';
import CommentBoard from '@/components/diet/CommentBoard';

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(16);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

export default async function MyDietPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: challenge } = await supabase
    .from('diet_challenges')
    .select('id, title, start_weight, target_weight, target_date, deposit, invite_code')
    .eq('user_id', user.id)
    .single();

  if (!challenge) redirect('/home');

  let inviteCode = challenge.invite_code as string | null;
  if (!inviteCode) {
    inviteCode = generateInviteCode();
    await supabase
      .from('diet_challenges')
      .update({ invite_code: inviteCode })
      .eq('id', challenge.id);
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: latestLog } = await supabase
    .from('diet_daily_logs')
    .select('weight, logged_date, photo_url')
    .eq('challenge_id', challenge.id)
    .order('logged_date', { ascending: false })
    .limit(1)
    .single();

  const currentWeight: number = latestLog?.weight ?? challenge.start_weight;
  const todayWeight: number | null =
    latestLog?.logged_date === today ? (latestLog.weight as number) : null;
  const todayPhotoPath: string | null =
    latestLog?.logged_date === today ? (latestLog.photo_url as string | null) : null;

  const { data: booms } = await supabase
    .from('diet_booms')
    .select('is_boom_up')
    .eq('challenge_id', challenge.id);

  const boomUp = booms?.filter(b => b.is_boom_up).length ?? 0;
  const boomDown = booms?.filter(b => !b.is_boom_up).length ?? 0;

  const daysLeft = Math.ceil(
    (new Date(challenge.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const startWeight = challenge.start_weight as number;
  const targetWeight = challenge.target_weight as number;
  const diff = +(targetWeight - currentWeight).toFixed(1);

  // 진행률 (감량 방향)
  const totalChange = startWeight - targetWeight;
  const currentChange = startWeight - currentWeight;
  const progress = totalChange > 0
    ? Math.min(100, Math.max(0, Math.round((currentChange / totalChange) * 100)))
    : 0;

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#F8F4FF' }}>
      <TopHeader title="내 다이어트" showBack={false} />

      <ScrollableArea>
        <div className="px-4 py-5 flex flex-col gap-4 pb-8">

          {/* 챌린지 타이틀 카드 */}
          <div
            className="rounded-2xl px-5 py-4 flex flex-col gap-3"
            style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
          >
            <p className="text-base font-bold" style={{ color: '#1A0A3D' }}>{challenge.title as string}</p>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: '#EDE0FF', color: '#7B4DBE' }}
              >
                D-{daysLeft}일
              </span>
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: '#F8F4FF', color: '#A67FD4' }}
              >
                💰 {(challenge.deposit as number).toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 체중 현황 카드 */}
          <div
            className="rounded-2xl px-5 py-5 flex flex-col gap-4"
            style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
          >
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: '#A67FD4' }}>현재 체중</p>
                <p className="font-extrabold leading-none" style={{ color: '#1A0A3D', fontSize: '48px' }}>
                  {currentWeight}
                  <span className="text-lg font-semibold ml-1" style={{ color: '#A67FD4' }}>kg</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium mb-1" style={{ color: '#A67FD4' }}>목표까지</p>
                <p className="text-2xl font-bold" style={{ color: diff <= 0 ? '#4CAF50' : '#7B4DBE' }}>
                  {diff > 0 ? `${diff}kg` : `${Math.abs(diff)}kg ✓`}
                </p>
              </div>
            </div>

            {/* 진행률 바 */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs" style={{ color: '#A67FD4' }}>시작 {startWeight}kg</span>
                <span className="text-xs font-semibold" style={{ color: '#7B4DBE' }}>{progress}%</span>
                <span className="text-xs" style={{ color: '#A67FD4' }}>목표 {targetWeight}kg</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#EDE0FF' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, backgroundColor: '#7B4DBE' }}
                />
              </div>
            </div>
          </div>

          {/* 오늘 체중 기록 버튼 */}
          <DailyLogButton
            challengeId={challenge.id}
            userId={user.id}
            todayWeight={todayWeight}
            todayPhotoPath={todayPhotoPath}
          />

          {/* 붐업 / 붐다운 */}
          <div className="flex gap-3">
            <div
              className="flex-1 rounded-2xl flex flex-col items-center py-4 gap-1"
              style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
            >
              <span className="text-lg">👍</span>
              <p className="text-xl font-bold" style={{ color: '#1A0A3D' }}>{boomUp}</p>
              <p className="text-xs" style={{ color: '#A67FD4' }}>붐업</p>
            </div>
            <div
              className="flex-1 rounded-2xl flex flex-col items-center py-4 gap-1"
              style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
            >
              <span className="text-lg">👎</span>
              <p className="text-xl font-bold" style={{ color: '#1A0A3D' }}>{boomDown}</p>
              <p className="text-xs" style={{ color: '#A67FD4' }}>붐다운</p>
            </div>
          </div>

          {/* 적들의 댓글 */}
          <CommentBoard
            challengeId={challenge.id}
            challengeOwnerId={user.id}
            buttonLabel="💬 적들의 댓글 보기"
            placeholder="적들에게 한마디..."
          />

          {/* 적들 초대 */}
          <InviteModal inviteCode={inviteCode ?? ''} />

        </div>
      </ScrollableArea>
    </main>
  );
}
