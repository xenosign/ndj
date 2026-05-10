import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TopHeader from '@/components/layout/TopHeader';
import JoinButton from '@/components/diet/JoinButton';

export default async function JoinCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: challenge } = await supabase
    .from('diet_challenges')
    .select('id, title, target_date, target_weight, user_id')
    .eq('invite_code', code)
    .single();

  if (!challenge) {
    return (
      <main className="flex flex-1 flex-col" style={{ backgroundColor: '#1A0A3D' }}>
        <TopHeader title="참여 실패" backHref="/home" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <p className="text-4xl">❌</p>
          <p className="text-base font-semibold text-center" style={{ color: '#D4C0F0' }}>
            유효하지 않은 코드입니다.
          </p>
        </div>
      </main>
    );
  }

  if (challenge.user_id === user.id) redirect('/diet/my');

  const { data: existing } = await supabase
    .from('diet_participants')
    .select('id')
    .eq('challenge_id', challenge.id)
    .eq('user_id', user.id)
    .single();

  const daysLeft = Math.ceil(
    (new Date(challenge.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#1A0A3D' }}>
      <TopHeader title="적 다이어트 참여" backHref="/home" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <div
          className="w-full rounded-2xl p-6 flex flex-col gap-3"
          style={{ backgroundColor: '#2A1560' }}
        >
          <p className="text-xs font-medium" style={{ color: '#D4C0F0' }}>챌린지</p>
          <h2 className="text-xl font-bold" style={{ color: '#A67FD4' }}>
            {challenge.title}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <span
              className="text-sm font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: '#4A2B8A', color: '#A67FD4' }}
            >
              D - {daysLeft}일
            </span>
            <span className="text-sm font-medium" style={{ color: '#D4C0F0' }}>
              목표 {challenge.target_weight}kg
            </span>
          </div>
        </div>

        {existing ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-2xl">⚔️</p>
            <p className="text-sm font-medium" style={{ color: '#D4C0F0' }}>
              이미 이 챌린지에 참여 중입니다.
            </p>
          </div>
        ) : (
          <JoinButton challengeId={challenge.id} challengeOwnerId={challenge.user_id as string} />
        )}
      </div>
    </main>
  );
}
