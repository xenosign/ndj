'use client';

import { useState } from 'react';
import Image from 'next/image';

const PLACEHOLDER_REACTIONS = [
  { emoji: '👍', sentiment: 'good' },
  { emoji: '🔥', sentiment: 'good' },
  { emoji: '💪', sentiment: 'good' },
  { emoji: '😂', sentiment: 'neutral' },
  { emoji: '🤣', sentiment: 'neutral' },
  { emoji: '😱', sentiment: 'neutral' },
  { emoji: '👎', sentiment: 'bad' },
  { emoji: '😤', sentiment: 'bad' },
];

const SENTIMENT_COLORS: Record<string, string> = {
  good: '#4A2B8A',
  neutral: '#F8F4FF',
  bad: '#F06292',
};

interface Participant {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  reaction?: string | null;
}

interface Props {
  participants: Participant[];
}

function Avatar({
  participant,
  index,
}: {
  participant: Participant;
  index: number;
}) {
  const initial = participant.nickname?.[0] ?? '?';
  const reactionData =
    PLACEHOLDER_REACTIONS[index % PLACEHOLDER_REACTIONS.length];
  const emoji = participant.reaction ?? reactionData.emoji;
  const bgColor = SENTIMENT_COLORS[reactionData.sentiment];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <div
          className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#EDE0FF' }}
        >
          {participant.avatarUrl ? (
            <Image
              src={participant.avatarUrl}
              alt={participant.nickname ?? ''}
              width={56}
              height={56}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-base font-bold" style={{ color: '#7B4DBE' }}>
              {initial}
            </span>
          )}
        </div>
        <div
          className="absolute -top-1 -right-1 rounded-full flex items-center justify-center"
          style={{
            width: 30,
            height: 30,
            fontSize: 16,
            backgroundColor: bgColor,
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}
        >
          {emoji}
        </div>
      </div>
      <span
        className="text-xs font-medium truncate w-14 text-center"
        style={{ color: '#4A2B8A' }}
      >
        {participant.nickname ?? '익명'}
      </span>
    </div>
  );
}

export default function EnemyReactionBar({ participants }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (participants.length === 0) return null;

  const needsExpand = participants.length > 8;
  const visibleCount = expanded
    ? participants.length
    : Math.min(participants.length, 8);
  const visible = participants.slice(0, visibleCount);

  return (
    <div
      className="rounded-2xl px-5 pb-4"
      style={{
        backgroundColor: '#F8F4FF',
        boxShadow: '0 4px 20px rgba(123,77,190,0.28)',
      }}
    >
      {/* pt-4: 뱃지 -top-1 overflow 공간 확보 */}
      <div className="pt-4 grid grid-cols-4 gap-y-4">
        {visible.map((p, i) => (
          <Avatar key={p.id} participant={p} index={i} />
        ))}
      </div>

      {needsExpand && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full mt-3 text-xs font-bold text-center transition-opacity active:opacity-70"
          style={{ color: '#7B4DBE' }}
        >
          {expanded ? '접기' : `··· ${participants.length - 8}명 더보기`}
        </button>
      )}
    </div>
  );
}
