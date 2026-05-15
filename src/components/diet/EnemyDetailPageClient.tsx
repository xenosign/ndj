'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getKSTDateString } from '@/utils/date';
import ScrollableArea from '@/components/layout/ScrollableArea';
import TopHeader from '@/components/layout/TopHeader';
import CommentCard from '@/components/diet/CommentCard';
import EnemyWeightTrendCard from '@/components/diet/EnemyWeightTrendCard';
import EnemyReactionSection from '@/components/diet/EnemyReactionSection';
import LeaveChallengeButton from '@/components/diet/LeaveChallengButton';

type PageData = {
  challenge: {
    id: string;
    title: string;
    start_weight: number;
    target_weight: number;
    target_date: string;
    user_id: string;
  };
  ownerNickname: string | null;
  recentLogs: { logged_date: string; weight: number }[];
  currentWeight: number;
  todayPhotoSignedUrl: string | null;
  missionPhotoSignedUrl: string | null;
  todayMission: { content: string; photo_url: string | null } | null;
  tomorrowMissionContent: string | null;
  alreadyRequested: boolean;
  myReaction: string | null;
  reactionParticipants: { id: string; nickname: string | null; avatarUrl: string | null; reaction: string | null }[];
  daysLeft: number;
  startWeight: number;
  targetWeight: number;
  progress: number;
  today: string;
};

function Skeleton({ backHref }: { backHref: string }) {
  const pulse = 'animate-pulse rounded-xl';
  const bar = (w: string, h = 'h-4') =>
    <div className={`${pulse} ${h} ${w}`} style={{ backgroundColor: '#D4C0F0' }} />;

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#F8F4FF' }}>
      <TopHeader title="적의 다이어트" backHref={backHref} />
      <ScrollableArea>
        <div className="px-4 py-5 flex flex-col gap-4 pb-8">

          {/* 타이틀 카드 */}
          <div
            className="rounded-2xl px-5 py-4 flex items-center justify-between"
            style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
          >
            {bar('w-40')}
            <div className={`${pulse} h-6 w-12 rounded-full ml-3`} style={{ backgroundColor: '#D4C0F0' }} />
          </div>

          {/* EnemyWeightTrendCard 스켈레톤 */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
          >
            <div className="flex justify-between">
              {bar('w-24')}
              {bar('w-16')}
            </div>
            <div className={`${pulse} h-28 w-full rounded-xl`} style={{ backgroundColor: '#D4C0F0' }} />
            <div className="flex gap-3 justify-between">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col gap-1 items-center flex-1">
                  {bar('w-full h-3')}
                  {bar('w-full h-5')}
                </div>
              ))}
            </div>
          </div>

          {/* EnemyReactionSection 스켈레톤 */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
          >
            {bar('w-32')}
            <div className={`${pulse} h-16 w-full rounded-xl`} style={{ backgroundColor: '#D4C0F0' }} />
            <div className="flex gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`${pulse} w-10 h-10 rounded-full`} style={{ backgroundColor: '#D4C0F0' }} />
              ))}
            </div>
          </div>

          {/* CommentCard 스켈레톤 */}
          <div className="flex flex-col gap-2">
            {bar('w-36 h-4 ml-1')}
            <div
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
            >
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`${pulse} w-8 h-8 rounded-full shrink-0`} style={{ backgroundColor: '#D4C0F0' }} />
                  <div className="flex flex-col gap-1 flex-1">
                    {bar('w-1/4 h-3')}
                    {bar('w-3/4 h-3')}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </ScrollableArea>
    </main>
  );
}

export default function EnemyDetailPageClient({
  userId,
  challengeId,
}: {
  userId: string;
  challengeId: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<PageData | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const today = getKSTDateString();
    const tomorrow = getKSTDateString(1);
    const sevenDaysAgoStr = getKSTDateString(-6);

    async function fetchAll() {
      const { data: challenge } = await supabase
        .from('diet_challenges')
        .select('id, title, start_weight, target_weight, target_date, user_id')
        .eq('id', challengeId)
        .single();

      if (!challenge) {
        router.replace('/diet/enemies');
        return;
      }

      let { data: participant } = await supabase
        .from('diet_participants')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!participant) {
        // 참여 직후 네비게이션 시 DB 반영 지연 대비 1회 재시도
        await new Promise(r => setTimeout(r, 600));
        const { data: retried } = await supabase
          .from('diet_participants')
          .select('id')
          .eq('challenge_id', challengeId)
          .eq('user_id', userId)
          .maybeSingle();
        if (!retried) {
          router.replace('/diet/enemies');
          return;
        }
        participant = retried;
      }

      const [
        { data: ownerProfile },
        { data: recentLogs },
        { data: todayMission },
        { data: tomorrowMission },
        { data: myVerification },
        { data: myReactionRow },
        reactionsRes,
        { data: participants },
      ] = await Promise.all([
        supabase.from('profiles').select('nickname').eq('id', challenge.user_id as string).single(),
        supabase
          .from('diet_daily_logs')
          .select('weight, logged_date, photo_url')
          .eq('challenge_id', challengeId)
          .gte('logged_date', sevenDaysAgoStr)
          .order('logged_date', { ascending: true }),
        supabase
          .from('diet_missions')
          .select('content, photo_url')
          .eq('challenge_id', challengeId)
          .eq('mission_date', today)
          .maybeSingle(),
        supabase
          .from('diet_missions')
          .select('content')
          .eq('challenge_id', challengeId)
          .eq('mission_date', tomorrow)
          .maybeSingle(),
        supabase
          .from('diet_mission_verifications')
          .select('id')
          .eq('challenge_id', challengeId)
          .eq('mission_date', today)
          .eq('requester_id', userId)
          .maybeSingle(),
        supabase
          .from('diet_reactions')
          .select('reaction')
          .eq('challenge_id', challengeId)
          .eq('logged_date', today)
          .eq('user_id', userId)
          .maybeSingle(),
        fetch(`/api/reactions?challengeId=${challengeId}&date=${today}`)
          .then(r => r.ok ? r.json() : { reactions: [] })
          .catch(() => ({ reactions: [] })),
        supabase
          .from('diet_participants')
          .select('user_id, character')
          .eq('challenge_id', challengeId),
      ]);

      const allReactions: { user_id: string; reaction: string; created_at: string }[] =
        reactionsRes.reactions ?? [];

      const latestLog = recentLogs && recentLogs.length > 0 ? recentLogs[recentLogs.length - 1] : null;
      const currentWeight: number = (latestLog?.weight as number | null) ?? (challenge.start_weight as number);
      const todayPhotoPath: string | null =
        latestLog?.logged_date === today ? (latestLog.photo_url as string | null) : null;

      const [todayPhotoSignedUrl, missionPhotoSignedUrl] = await Promise.all([
        todayPhotoPath
          ? supabase.storage.from('diet-photos').createSignedUrl(todayPhotoPath, 3600)
              .then(r => r.data?.signedUrl ?? null)
          : Promise.resolve(null),
        todayMission?.photo_url
          ? supabase.storage.from('diet-photos').createSignedUrl(todayMission.photo_url as string, 3600)
              .then(r => r.data?.signedUrl ?? null)
          : Promise.resolve(null),
      ]);

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

      const startWeight = challenge.start_weight as number;
      const targetWeight = challenge.target_weight as number;
      const totalChange = startWeight - targetWeight;
      const currentChange = startWeight - currentWeight;
      const progress = totalChange > 0
        ? Math.min(100, Math.max(0, Math.round((currentChange / totalChange) * 100)))
        : 0;
      const daysLeft = Math.ceil(
        (new Date(challenge.target_date as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      setData({
        challenge: challenge as PageData['challenge'],
        ownerNickname: (ownerProfile?.nickname as string | null) ?? null,
        recentLogs: (recentLogs ?? []).map(l => ({
          logged_date: l.logged_date as string,
          weight: l.weight as number,
        })),
        currentWeight,
        todayPhotoSignedUrl,
        missionPhotoSignedUrl,
        todayMission: todayMission ? {
          content: todayMission.content as string,
          photo_url: todayMission.photo_url as string | null,
        } : null,
        tomorrowMissionContent: (tomorrowMission?.content as string | null) ?? null,
        alreadyRequested: !!myVerification,
        myReaction: (myReactionRow?.reaction as string | null) ?? null,
        reactionParticipants,
        daysLeft,
        startWeight,
        targetWeight,
        progress,
        today,
      });
    }

    fetchAll();
  }, [userId, challengeId, router]);

  if (!data) return <Skeleton backHref="/diet/enemies" />;

  const { challenge, ownerNickname, recentLogs, currentWeight, todayPhotoSignedUrl,
    missionPhotoSignedUrl, todayMission, tomorrowMissionContent, alreadyRequested,
    myReaction, reactionParticipants, daysLeft, startWeight, targetWeight, progress, today } = data;

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#F8F4FF' }}>
      <TopHeader title={ownerNickname ?? '적의 다이어트'} backHref="/diet/enemies" />

      <ScrollableArea>
        <div className="px-4 py-5 flex flex-col gap-4 pb-8">

          {/* 챌린지 타이틀 카드 */}
          <div
            className="rounded-2xl px-5 py-4 flex items-center justify-between"
            style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
          >
            <p className="text-base font-bold truncate" style={{ color: '#1A0A3D' }}>{challenge.title}</p>
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
            recentLogs={recentLogs}
            progress={progress}
            hasPhoto={!!todayPhotoSignedUrl}
            signedUrl={todayPhotoSignedUrl}
            challengeId={challenge.id}
            challengeOwnerId={challenge.user_id}
          />

          <EnemyReactionSection
            challengeId={challenge.id}
            challengeOwnerId={challenge.user_id}
            todayMission={todayMission}
            todayPhotoSignedUrl={missionPhotoSignedUrl}
            alreadyRequested={alreadyRequested}
            myReaction={myReaction}
            today={today}
            tomorrowMissionContent={tomorrowMissionContent}
            initialParticipants={reactionParticipants}
            currentUserId={userId}
          />

          {/* 댓글 */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold px-1" style={{ color: '#1A0A3D' }}>다른 사람의 댓글보기</p>
            <CommentCard challengeId={challenge.id} challengeOwnerId={challenge.user_id} />
          </div>

          {/* 탈퇴 */}
          <LeaveChallengeButton challengeId={challenge.id} />

        </div>
      </ScrollableArea>
    </main>
  );
}
