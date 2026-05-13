import ScrollableArea from '@/components/layout/ScrollableArea';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TopHeader from '@/components/layout/TopHeader';
import CommentCard from '@/components/diet/CommentCard';
import EnemyWeightTrendCard from '@/components/diet/EnemyWeightTrendCard';
import EnemyReactionSection from '@/components/diet/EnemyReactionSection';
import LeaveChallengeButton from '@/components/diet/LeaveChallengButton';

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
    .select('id, title, start_weight, target_weight, target_date, user_id')
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

  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', challenge.user_id)
    .single();

  const today = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const [
    { data: recentLogs },
    { data: todayMission },
    { data: tomorrowMission },
    { data: myVerification },
    { data: myReactionRow },
    { data: allReactions },
    { data: participants },
  ] = await Promise.all([
    supabase
      .from('diet_daily_logs')
      .select('weight, logged_date, photo_url')
      .eq('challenge_id', id)
      .gte('logged_date', sevenDaysAgoStr)
      .order('logged_date', { ascending: true }),
    supabase
      .from('diet_missions')
      .select('content, photo_url')
      .eq('challenge_id', id)
      .eq('mission_date', today)
      .maybeSingle(),
    supabase
      .from('diet_missions')
      .select('content')
      .eq('challenge_id', id)
      .eq('mission_date', tomorrow)
      .maybeSingle(),
    supabase
      .from('diet_mission_verifications')
      .select('id')
      .eq('challenge_id', id)
      .eq('mission_date', today)
      .eq('requester_id', user.id)
      .maybeSingle(),
    supabase
      .from('diet_reactions')
      .select('reaction')
      .eq('challenge_id', id)
      .eq('logged_date', today)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('diet_reactions')
      .select('user_id, reaction, created_at')
      .eq('challenge_id', id)
      .eq('logged_date', today),
    supabase
      .from('diet_participants')
      .select('user_id, character')
      .eq('challenge_id', id),
  ]);

  const latestLog = recentLogs && recentLogs.length > 0 ? recentLogs[recentLogs.length - 1] : null;
  const currentWeight: number = latestLog?.weight ?? (challenge.start_weight as number);
  const todayPhotoPath: string | null =
    latestLog?.logged_date === today ? (latestLog.photo_url as string | null) : null;

  let todayPhotoSignedUrl: string | null = null;
  if (todayPhotoPath) {
    const { data: signedData } = await supabase.storage
      .from('diet-photos')
      .createSignedUrl(todayPhotoPath, 3600);
    todayPhotoSignedUrl = signedData?.signedUrl ?? null;
  }

  let missionPhotoSignedUrl: string | null = null;
  if (todayMission?.photo_url) {
    const { data: signedData } = await supabase.storage
      .from('diet-photos')
      .createSignedUrl(todayMission.photo_url as string, 3600);
    missionPhotoSignedUrl = signedData?.signedUrl ?? null;
  }

  const participantIds = (participants ?? []).map(p => p.user_id as string);
  const characterMap = Object.fromEntries(
    (participants ?? []).map(p => [p.user_id as string, p.character as string | null])
  );
  const { data: participantProfiles } = participantIds.length > 0
    ? await supabase.from('profiles').select('id, nickname, avatar_url').in('id', participantIds)
    : { data: [] };

  const reactionMap = Object.fromEntries(
    (allReactions ?? []).map(r => [r.user_id as string, r.reaction as string])
  );
  const reactionTimeMap = Object.fromEntries(
    (allReactions ?? []).map(r => [r.user_id as string, r.created_at as string])
  );
  const reactionParticipants = (participantProfiles ?? [])
    .map(p => {
      const uid = p.id as string;
      const character = characterMap[uid];
      const isAnonymous = character && character !== 'kakao' && character !== 'nickname';
      return {
        id: uid,
        nickname: isAnonymous ? character : (p.nickname as string | null),
        avatarUrl: isAnonymous ? null : (p.avatar_url as string | null),
        reaction: reactionMap[uid] ?? null,
        reactionAt: reactionTimeMap[uid] ?? null,
      };
    })
    .sort((a, b) => {
      if (a.reaction && !b.reaction) return -1;
      if (!a.reaction && b.reaction) return 1;
      if (a.reactionAt && b.reactionAt) return b.reactionAt.localeCompare(a.reactionAt);
      return 0;
    })
    .map(({ reactionAt: _, ...p }) => p);

  const daysLeft = Math.ceil(
    (new Date(challenge.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const startWeight = challenge.start_weight as number;
  const targetWeight = challenge.target_weight as number;
  const totalChange = startWeight - targetWeight;
  const currentChange = startWeight - currentWeight;
  const progress = totalChange > 0
    ? Math.min(100, Math.max(0, Math.round((currentChange / totalChange) * 100)))
    : 0;

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#F8F4FF' }}>
      <TopHeader title={ownerProfile?.nickname ?? '적의 다이어트'} backHref="/diet/enemies" />

      <ScrollableArea>
        <div className="px-4 py-5 flex flex-col gap-4 pb-8">

          {/* 챌린지 타이틀 카드 */}
          <div
            className="rounded-2xl px-5 py-4 flex items-center justify-between"
            style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
          >
            <p className="text-base font-bold truncate" style={{ color: '#1A0A3D' }}>{challenge.title as string}</p>
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full shrink-0 ml-3"
              style={{ backgroundColor: '#EDE0FF', color: '#7B4DBE' }}
            >
              D-{daysLeft}
            </span>
          </div>

          {/* 체중 현황 카드 */}
          <EnemyWeightTrendCard
            currentWeight={currentWeight}
            startWeight={startWeight}
            targetWeight={targetWeight}
            recentLogs={(recentLogs ?? []).map(l => ({
              logged_date: l.logged_date as string,
              weight: l.weight as number,
            }))}
            progress={progress}
            hasPhoto={!!todayPhotoPath}
            signedUrl={todayPhotoSignedUrl}
            challengeId={challenge.id}
            challengeOwnerId={challenge.user_id as string}
          />

          <EnemyReactionSection
            challengeId={challenge.id}
            challengeOwnerId={challenge.user_id as string}
            todayMission={todayMission ? {
              content: todayMission.content as string,
              photo_url: todayMission.photo_url as string | null,
            } : null}
            todayPhotoSignedUrl={missionPhotoSignedUrl}
            alreadyRequested={!!myVerification}
            myReaction={(myReactionRow?.reaction as string | null) ?? null}
            today={today}
            tomorrowMissionContent={(tomorrowMission?.content as string | null) ?? null}
            initialParticipants={reactionParticipants}
            currentUserId={user.id}
          />

          {/* 댓글 */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold px-1" style={{ color: '#1A0A3D' }}>다른 사람의 댓글보기</p>
            <CommentCard
              challengeId={challenge.id}
              challengeOwnerId={challenge.user_id as string}
            />
          </div>

          {/* 탈퇴 */}
          <LeaveChallengeButton challengeId={challenge.id} />

        </div>
      </ScrollableArea>
    </main>
  );
}
