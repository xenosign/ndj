import { randomBytes } from 'crypto';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TopHeader from '@/components/layout/TopHeader';
import InviteModal from '@/components/diet/InviteModal';
import DailyLogButton from '@/components/diet/DailyLogButton';

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
    .select('id, title, start_weight, target_weight, target_date, invite_code')
    .eq('user_id', user.id)
    .single();

  if (!challenge) redirect('/home');

  // invite_code 없으면 생성해서 저장
  let inviteCode = challenge.invite_code as string | null;
  if (!inviteCode) {
    inviteCode = generateInviteCode();
    await supabase
      .from('diet_challenges')
      .update({ invite_code: inviteCode })
      .eq('id', challenge.id);
  }

  const today = new Date().toISOString().split('T')[0];

  // 최근 일일 기록에서 현재 체중 조회
  const { data: latestLog } = await supabase
    .from('diet_daily_logs')
    .select('weight, logged_date')
    .eq('challenge_id', challenge.id)
    .order('logged_date', { ascending: false })
    .limit(1)
    .single();

  const currentWeight: number = latestLog?.weight ?? challenge.start_weight;
  const todayWeight: number | null =
    latestLog?.logged_date === today ? (latestLog.weight as number) : null;

  // 붐업 / 붐다운 집계
  const { data: booms } = await supabase
    .from('diet_booms')
    .select('is_boom_up')
    .eq('challenge_id', challenge.id);

  const boomUp = booms?.filter(b => b.is_boom_up).length ?? 0;
  const boomDown = booms?.filter(b => !b.is_boom_up).length ?? 0;

  const daysLeft = Math.ceil(
    (new Date(challenge.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const diff = +(challenge.target_weight - currentWeight).toFixed(1);
  const LABEL_COLOR = '#E8D5B0';

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#2C1A0E' }}>
      <TopHeader title="내 다이어트" backHref="/home" />

      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">

        {/* 다이어트 제목 + D-X일 */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: '#F2C14E' }}>
            {challenge.title}
          </h2>
          <span
            className="text-sm font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: '#7B4A2D', color: '#F2C14E' }}
          >
            D - {daysLeft}일
          </span>
        </div>

        {/* 목표까지 남은 체중 */}
        <div className="flex flex-col items-center justify-center flex-1 gap-2">
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
            <DailyLogButton
              challengeId={challenge.id}
              userId={user.id}
              todayWeight={todayWeight}
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

        {/* 적들의 댓글 보기 */}
        <button
          className="w-full rounded-2xl font-semibold text-sm py-4 transition-opacity hover:opacity-85 active:opacity-70"
          style={{ backgroundColor: '#F5A58A', color: '#2C1A0E' }}
        >
          🔥 적들의 댓글 보기
        </button>

        {/* 붐업 / 붐다운 */}
        <div className="flex rounded-2xl overflow-hidden" style={{ backgroundColor: '#3D2510' }}>
          <div className="flex-1 flex flex-col items-center py-4 gap-1">
            <span className="text-xs font-medium" style={{ color: LABEL_COLOR }}>붐업 👍</span>
            <span className="text-2xl font-bold" style={{ color: '#F2C14E' }}>{boomUp.toLocaleString()}</span>
          </div>
          <div style={{ width: 1, backgroundColor: '#7B4A2D', margin: '12px 0' }} />
          <div className="flex-1 flex flex-col items-center py-4 gap-1">
            <span className="text-xs font-medium" style={{ color: LABEL_COLOR }}>붐다운 👎</span>
            <span className="text-2xl font-bold" style={{ color: '#F5A58A' }}>{boomDown.toLocaleString()}</span>
          </div>
        </div>

        {/* 적들 초대하기 */}
        <InviteModal inviteCode={inviteCode ?? ''} />
      </div>
    </main>
  );
}
