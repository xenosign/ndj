'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useBackClose } from '@/hooks/useBackClose';

interface Participant {
  nickname: string | null;
  avatarUrl: string | null;
  reaction: string;
}

interface Props {
  good: Participant[];
  neutral: Participant[];
  bad: Participant[];
}

const CARDS = [
  { key: 'good' as const, label: '👍 긍정', bg: '#4A2B8A', numColor: '#F8F4FF', labelColor: '#C4A0E8', popupTitle: '👍 긍정 반응' },
  { key: 'neutral' as const, label: '😐 보통', bg: '#F8F4FF', numColor: '#1A0A3D', labelColor: '#A67FD4', popupTitle: '😐 보통 반응' },
  { key: 'bad' as const, label: '👎 부정', bg: '#F06292', numColor: '#F8F4FF', labelColor: '#FFE0EE', popupTitle: '👎 부정 반응' },
];

function Avatar({ participant, badgeBg }: { participant: Participant; badgeBg: string }) {
  const initial = participant.nickname?.[0] ?? '?';
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <div
          className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#EDE0FF' }}
        >
          {participant.avatarUrl?.startsWith('http') ? (
            <Image src={participant.avatarUrl} alt={participant.nickname ?? ''} width={56} height={56} className="object-cover w-full h-full" />
          ) : (
            <span style={{ fontSize: 16, fontWeight: 700, color: '#7B4DBE' }}>{initial}</span>
          )}
        </div>
        <div
          className="absolute -top-1 -right-1 rounded-full flex items-center justify-center"
          style={{ width: 28, height: 28, fontSize: 15, backgroundColor: badgeBg, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
        >
          {participant.reaction}
        </div>
      </div>
      <span className="text-xs font-medium truncate w-14 text-center" style={{ color: '#4A2B8A' }}>
        {participant.nickname ?? '익명'}
      </span>
    </div>
  );
}

export default function ReactionSummaryCard({ good, neutral, bad }: Props) {
  const [activeKey, setActiveKey] = useState<'good' | 'neutral' | 'bad' | null>(null);
  useBackClose(activeKey !== null, () => setActiveKey(null));
  const data = { good, neutral, bad };
  const activeCard = CARDS.find(c => c.key === activeKey);
  const activeList = activeKey ? data[activeKey] : [];

  return (
    <>
      <div className="flex gap-2">
        {CARDS.map(card => (
          <button
            key={card.key}
            onClick={() => setActiveKey(card.key)}
            className="flex-1 rounded-2xl py-4 flex flex-col items-center gap-1 transition-opacity active:opacity-75"
            style={{ backgroundColor: card.bg, boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
          >
            <p className="text-xl font-bold" style={{ color: card.numColor }}>{data[card.key].length}</p>
            <p className="text-xs" style={{ color: card.labelColor }}>{card.label}</p>
          </button>
        ))}
      </div>

      {activeKey && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setActiveKey(null)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl flex flex-col"
            style={{ backgroundColor: '#F8F4FF', maxHeight: '60dvh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-4 shrink-0">
              <div
                onClick={() => setActiveKey(null)}
                className="w-10 h-1 rounded-full mx-auto mb-4 cursor-pointer"
                style={{ backgroundColor: '#D4C0F0' }}
              />
              <h2 className="text-base font-bold" style={{ color: '#1A0A3D' }}>{activeCard?.popupTitle}</h2>
            </div>
            <div className="overflow-y-auto px-5 pb-10">
              {activeList.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: '#A67FD4' }}>아직 반응이 없어요</p>
              ) : (
                <div className="grid grid-cols-4 gap-y-4 pt-2">
                  {activeList.map((p, i) => (
                    <Avatar key={i} participant={p} badgeBg={activeCard!.bg} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
