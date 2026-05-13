'use client';

import { useState } from 'react';
import EnemyMissionCard from './EnemyMissionCard';
import EnemyReactionBar from './EnemyReactionBar';

interface Participant {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  reaction?: string | null;
}

interface Props {
  challengeId: string;
  challengeOwnerId: string;
  todayMission: { content: string; photo_url: string | null } | null;
  todayPhotoSignedUrl: string | null;
  alreadyRequested: boolean;
  myReaction: string | null;
  today: string;
  tomorrowMissionContent: string | null;
  initialParticipants: Participant[];
  currentUserId: string;
}

export default function EnemyReactionSection({
  challengeId,
  challengeOwnerId,
  todayMission,
  todayPhotoSignedUrl,
  alreadyRequested,
  myReaction,
  today,
  tomorrowMissionContent,
  initialParticipants,
  currentUserId,
}: Props) {
  const [participants, setParticipants] = useState(initialParticipants);

  function handleReactionChange(newReaction: string | null) {
    setParticipants(prev =>
      prev.map(p => p.id === currentUserId ? { ...p, reaction: newReaction } : p)
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold px-1" style={{ color: '#1A0A3D' }}>오늘의 미션</p>
        <EnemyMissionCard
          challengeId={challengeId}
          challengeOwnerId={challengeOwnerId}
          todayMission={todayMission}
          todayPhotoSignedUrl={todayPhotoSignedUrl}
          alreadyRequested={alreadyRequested}
          myReaction={myReaction}
          today={today}
          onReactionChange={handleReactionChange}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold px-1" style={{ color: '#1A0A3D' }}>내일 미션</p>
        <div
          className="rounded-2xl px-5 py-4"
          style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
        >
          {tomorrowMissionContent ? (
            <p className="text-sm leading-relaxed" style={{ color: '#1A0A3D' }}>{tomorrowMissionContent}</p>
          ) : (
            <p className="text-sm text-center py-1" style={{ color: '#A67FD4' }}>내일 미션이 없어요</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold px-1" style={{ color: '#1A0A3D' }}>다른 사람들 반응 보기</p>
        <EnemyReactionBar participants={participants} />
      </div>
    </>
  );
}
