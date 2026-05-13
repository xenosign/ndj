import ScrollableArea from '@/components/layout/ScrollableArea';
import { randomBytes } from 'crypto';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getKSTDateString } from '@/utils/date';
import TopHeader from '@/components/layout/TopHeader';
import InviteModal from '@/components/diet/InviteModal';
import WeightTrendCard from '@/components/diet/WeightTrendCard';
import CommentCard from '@/components/diet/CommentCard';
import EnemyReactionBar from '@/components/diet/EnemyReactionBar';
import ReactionSummaryCard from '@/components/diet/ReactionSummaryCard';
import MissionCard from '@/components/diet/MissionCard';

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

  const today = getKSTDateString();
  const tomorrow = getKSTDateString(1);
  const sevenDaysAgoStr = getKSTDateString(-6);

  const { data: recentLogs } = await supabase
    .from('diet_daily_logs')
    .select('weight, logged_date, photo_url')
    .eq('challenge_id', challenge.id)
    .gte('logged_date', sevenDaysAgoStr)
    .order('logged_date', { ascending: true });

  const latestLog = recentLogs && recentLogs.length > 0 ? recentLogs[recentLogs.length - 1] : null;

  const currentWeight: number = latestLog?.weight ?? challenge.start_weight;
  const todayWeight: number | null =
    latestLog?.logged_date === today ? (latestLog.weight as number) : null;
  const todayPhotoPath: string | null =
    latestLog?.logged_date === today ? (latestLog.photo_url as string | null) : null;

  const [
    { data: participants },
    { data: todayReactions },
    { data: todayMission },
    { data: tomorrowMission },
    { data: verifications },
  ] = await Promise.all([
    supabase
      .from('diet_participants')
      .select('user_id, character')
      .eq('challenge_id', challenge.id),
    supabase
      .from('diet_reactions')
      .select('user_id, reaction, created_at')
      .eq('challenge_id', challenge.id)
      .eq('logged_date', today),
    supabase
      .from('diet_missions')
      .select('id, content, photo_url')
      .eq('challenge_id', challenge.id)
      .eq('mission_date', today)
      .maybeSingle(),
    supabase
      .from('diet_missions')
      .select('id, content')
      .eq('challenge_id', challenge.id)
      .eq('mission_date', tomorrow)
      .maybeSingle(),
    supabase
      .from('diet_mission_verifications')
      .select('id')
      .eq('challenge_id', challenge.id)
      .eq('mission_date', today),
  ]);

  let missionPhotoSignedUrl: string | null = null;
  if (todayMission?.photo_url) {
    const { data: signedData } = await supabase.storage
      .from('diet-photos')
      .createSignedUrl(todayMission.photo_url as string, 3600);
    missionPhotoSignedUrl = signedData?.signedUrl ?? null;
  }

  // 참여자 프로필 fetch
  const participantIds = (participants ?? []).map(p => p.user_id as string);
  const characterMap = Object.fromEntries(
    (participants ?? []).map(p => [p.user_id as string, p.character as string | null])
  );
  const { data: participantProfiles } = participantIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .in('id', participantIds)
    : { data: [] };

  // 오늘 반응 집계
  const REACTION_SENTIMENT: Record<string, 'good' | 'neutral' | 'bad'> = {
    '👍': 'good', '🔥': 'good', '💪': 'good', '❤️': 'good', '🎉': 'good',
    '😍': 'good', '🤩': 'good', '🙌': 'good', '✨': 'good', '😎': 'good',
    '😐': 'neutral', '🤔': 'neutral', '😶': 'neutral', '😑': 'neutral', '🙂': 'neutral',
    '😏': 'neutral', '👀': 'neutral', '🤷': 'neutral', '😮': 'neutral', '💭': 'neutral',
    '👎': 'bad', '😤': 'bad', '😠': 'bad', '😒': 'bad', '😞': 'bad',
    '😔': 'bad', '💢': 'bad', '🤦': 'bad', '😩': 'bad', '😫': 'bad',
  };
  const reactionMap = Object.fromEntries(
    (todayReactions ?? []).map(r => [r.user_id as string, r.reaction as string])
  );
  const reactionTimeMap = Object.fromEntries(
    (todayReactions ?? []).map(r => [r.user_id as string, r.created_at as string])
  );
  const profileMap = Object.fromEntries(
    (participantProfiles ?? []).map(p => [p.id as string, p])
  );
  const sentimentParticipants: Record<'good' | 'neutral' | 'bad', { nickname: string | null; avatarUrl: string | null; reaction: string }[]> = {
    good: [], neutral: [], bad: [],
  };
  (todayReactions ?? []).forEach(r => {
    const sentiment = REACTION_SENTIMENT[r.reaction as string];
    if (sentiment) {
      const profile = profileMap[r.user_id as string];
      sentimentParticipants[sentiment].push({
        nickname: (profile?.nickname as string | null) ?? null,
        avatarUrl: (profile?.avatar_url as string | null) ?? null,
        reaction: r.reaction as string,
      });
    }
  });



  const daysLeft = Math.ceil(
    (new Date(challenge.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const startWeight = challenge.start_weight as number;
  const targetWeight = challenge.target_weight as number;

  // 진행률 (감량 방향)
  const totalChange = startWeight - targetWeight;
  const currentChange = startWeight - currentWeight;
  const progress = totalChange > 0
    ? Math.min(100, Math.max(0, Math.round((currentChange / totalChange) * 100)))
    : 0;

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#F8F4FF' }}>
      <TopHeader showBack={false} />

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

          {/* 체중 현황 카드 (그래프 + 기록 버튼 통합) */}
          <WeightTrendCard
            challengeId={challenge.id}
            userId={user.id}
            currentWeight={currentWeight}
            startWeight={startWeight}
            targetWeight={targetWeight}
            todayWeight={todayWeight}
            todayPhotoPath={todayPhotoPath}
            recentLogs={(recentLogs ?? []).map(l => ({ logged_date: l.logged_date as string, weight: l.weight as number }))}
            progress={progress}
          />

          {/* 오늘의 미션 */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold px-1" style={{ color: '#1A0A3D' }}>오늘의 미션</p>
            <MissionCard
              challengeId={challenge.id}
              userId={user.id}
              todayMission={todayMission ? {
                id: todayMission.id as string,
                content: todayMission.content as string,
                photo_url: todayMission.photo_url as string | null,
              } : null}
              tomorrowMission={tomorrowMission ? {
                id: tomorrowMission.id as string,
                content: tomorrowMission.content as string,
              } : null}
              todayPhotoSignedUrl={missionPhotoSignedUrl}
              verificationCount={verifications?.length ?? 0}
              today={today}
              tomorrow={tomorrow}
            />
          </div>

          {/* 적들의 반응 */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold px-1" style={{ color: '#1A0A3D' }}>적들의 반응</p>
            <EnemyReactionBar
              participants={(participantProfiles ?? [])
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
                .map(({ reactionAt: _, ...p }) => p)
              }
            />

            {/* 반응 통계 카드 */}
            <ReactionSummaryCard
              good={sentimentParticipants.good}
              neutral={sentimentParticipants.neutral}
              bad={sentimentParticipants.bad}
            />
          </div>

          {/* 적들의 댓글 */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold px-1" style={{ color: '#1A0A3D' }}>적들의 댓글</p>
            <CommentCard challengeId={challenge.id} challengeOwnerId={user.id} />
          </div>

          {/* 적들 초대 */}
          <InviteModal inviteCode={inviteCode ?? ''} />

        </div>
      </ScrollableArea>
    </main>
  );
}
