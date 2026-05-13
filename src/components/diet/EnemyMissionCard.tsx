'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { notifyUser } from '@/lib/notify';

const EMOJI_CATEGORIES = {
  good:    ['👍', '🔥', '💪', '❤️', '🎉', '😍', '🤩', '🙌', '✨', '😎'],
  neutral: ['😐', '🤔', '😶', '😑', '🙂', '😏', '👀', '🤷', '😮', '💭'],
  bad:     ['👎', '😤', '😠', '😒', '😞', '😔', '💢', '🤦', '😩', '😫'],
} as const;

type Category = keyof typeof EMOJI_CATEGORIES;

const CATEGORY_META: { key: Category; label: string; bg: string; numColor: string; labelColor: string }[] = [
  { key: 'good',    label: '👍 긍정', bg: '#4A2B8A', numColor: '#F8F4FF', labelColor: '#C4A0E8' },
  { key: 'neutral', label: '😐 보통', bg: '#F8F4FF', numColor: '#1A0A3D', labelColor: '#A67FD4' },
  { key: 'bad',     label: '👎 부정', bg: '#F06292', numColor: '#F8F4FF', labelColor: '#FFE0EE' },
];

function getCategory(emoji: string | null): Category | null {
  if (!emoji) return null;
  for (const [cat, emojis] of Object.entries(EMOJI_CATEGORIES)) {
    if ((emojis as readonly string[]).includes(emoji)) return cat as Category;
  }
  return null;
}

interface Props {
  challengeId: string;
  challengeOwnerId: string;
  todayMission: { content: string; photo_url: string | null } | null;
  todayPhotoSignedUrl: string | null;
  alreadyRequested: boolean;
  myReaction: string | null;
  today: string;
  onReactionChange?: (reaction: string | null) => void;
}

export default function EnemyMissionCard({
  challengeId,
  challengeOwnerId,
  todayMission,
  todayPhotoSignedUrl,
  alreadyRequested,
  myReaction,
  today,
  onReactionChange,
}: Props) {
  const [photoViewOpen, setPhotoViewOpen] = useState(false);
  const [missionRequested, setMissionRequested] = useState(false);
  const [missionRequesting, setMissionRequesting] = useState(false);
  const [requested, setRequested] = useState(alreadyRequested);
  const [requesting, setRequesting] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<string | null>(myReaction);
  const [reacting, setReacting] = useState(false);
  const [openCategory, setOpenCategory] = useState<Category | null>(null);
  const [pendingEmoji, setPendingEmoji] = useState<string | null>(null);

  async function handleMissionRequest() {
    if (missionRequested || missionRequesting) return;
    setMissionRequesting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMissionRequesting(false); return; }
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single();
    const nickname = (profile?.nickname as string | null) ?? '누군가';
    notifyUser({
      targetUserId: challengeOwnerId,
      title: '오늘 미션 등록 요청 📣',
      body: `${nickname}님이 오늘의 미션 등록을 요청했습니다!`,
      url: '/diet/my',
    });
    setMissionRequested(true);
    setMissionRequesting(false);
  }

  async function handleRequest() {
    if (requested || requesting) return;
    setRequesting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setRequesting(false); return; }
    await supabase.from('diet_mission_verifications').insert({
      challenge_id: challengeId,
      mission_date: today,
      requester_id: user.id,
    });
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single();
    const nickname = (profile?.nickname as string | null) ?? '누군가';
    notifyUser({
      targetUserId: challengeOwnerId,
      title: '미션 인증 요청 📣',
      body: `${nickname}님이 오늘의 미션 인증 사진을 요청했습니다!`,
      url: '/diet/my',
    });
    setRequested(true);
    setRequesting(false);
  }

  async function handleReactionSubmit() {
    if (!pendingEmoji || reacting) return;
    setReacting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setReacting(false); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single();
    const nickname = (profile?.nickname as string | null) ?? '누군가';

    if (currentReaction === pendingEmoji) {
      await supabase
        .from('diet_reactions')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('logged_date', today)
        .eq('user_id', user.id);
      setCurrentReaction(null);
      onReactionChange?.(null);
    } else {
      await supabase.from('diet_reactions').upsert(
        { challenge_id: challengeId, logged_date: today, user_id: user.id, reaction: pendingEmoji },
        { onConflict: 'challenge_id,logged_date,user_id' }
      );
      setCurrentReaction(pendingEmoji);
      onReactionChange?.(pendingEmoji);
      notifyUser({
        targetUserId: challengeOwnerId,
        title: '적이 반응했어요 👀',
        body: `${nickname}님이 ${pendingEmoji} 반응을 남겼습니다!`,
        url: '/diet/my',
      });
    }

    setReacting(false);
    setOpenCategory(null);
    setPendingEmoji(null);
  }

  function openCategorySheet(cat: Category) {
    setPendingEmoji(currentReaction && getCategory(currentReaction) === cat ? currentReaction : null);
    setOpenCategory(cat);
  }

  const currentCategory = getCategory(currentReaction);

  return (
    <>
      <div
        className="rounded-2xl px-5 py-5 flex flex-col gap-4"
        style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
      >
        {todayMission ? (
          <>
            <p className="text-sm leading-relaxed" style={{ color: '#1A0A3D' }}>
              {todayMission.content}
            </p>

            {todayPhotoSignedUrl ? (
              <button
                onClick={() => setPhotoViewOpen(true)}
                className="w-full h-11 rounded-xl text-sm font-semibold active:opacity-70"
                style={{ backgroundColor: '#EDE0FF', color: '#7B4DBE' }}
              >
                📷 미션 인증 사진 보기
              </button>
            ) : (
              <button
                onClick={handleRequest}
                disabled={requested || requesting}
                className="w-full h-11 rounded-xl text-sm font-semibold transition-opacity active:opacity-70 disabled:opacity-60"
                style={{
                  backgroundColor: requested ? '#EDE0FF' : '#4A2B8A',
                  color: requested ? '#7B4DBE' : '#EDE0FF',
                }}
              >
                {requesting ? '요청 중...' : requested ? '🚩 인증 요청 완료' : '🚩 미션 인증 요청하기'}
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-center" style={{ color: '#A67FD4' }}>오늘 미션이 없어요</p>
            <button
              onClick={handleMissionRequest}
              disabled={missionRequested || missionRequesting}
              className="w-full h-11 rounded-xl text-sm font-semibold transition-opacity active:opacity-70 disabled:opacity-60"
              style={{
                backgroundColor: missionRequested ? '#EDE0FF' : '#4A2B8A',
                color: missionRequested ? '#7B4DBE' : '#EDE0FF',
              }}
            >
              {missionRequesting ? '요청 중...' : missionRequested ? '📣 등록 요청 완료' : '📣 오늘 미션 등록 요청'}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold" style={{ color: '#A67FD4' }}>반응 남기기</p>
          <div className="flex gap-2">
            {CATEGORY_META.map(meta => (
              <button
                key={meta.key}
                onClick={() => openCategorySheet(meta.key)}
                className="flex-1 rounded-2xl py-4 flex flex-col items-center gap-1 active:opacity-75"
                style={{
                  backgroundColor: meta.bg,
                  boxShadow: currentCategory === meta.key
                    ? '0 0 0 2px #7B4DBE'
                    : '0 4px 20px rgba(123,77,190,0.28)',
                }}
              >
                {currentCategory === meta.key && currentReaction ? (
                  <p className="text-xl">{currentReaction}</p>
                ) : (
                  <p className="text-xl font-bold" style={{ color: meta.numColor }}>-</p>
                )}
                <p className="text-xs" style={{ color: meta.labelColor }}>{meta.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 사진 보기 모달 */}
      {photoViewOpen && todayPhotoSignedUrl && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setPhotoViewOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl flex flex-col"
            style={{ backgroundColor: '#F8F4FF', maxHeight: '85dvh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-3 shrink-0">
              <div onClick={() => setPhotoViewOpen(false)} className="w-10 h-1 rounded-full mx-auto mb-4 cursor-pointer" style={{ backgroundColor: '#D4C0F0' }} />
              <h2 className="text-base font-bold" style={{ color: '#1A0A3D' }}>미션 인증 사진</h2>
            </div>
            <div className="overflow-y-auto px-6">
              <div className="w-full rounded-2xl overflow-hidden">
                <img src={todayPhotoSignedUrl} alt="미션 인증 사진" className="w-full h-auto" />
              </div>
            </div>
            <div className="px-6 pt-4 pb-10 shrink-0">
              <button
                onClick={() => setPhotoViewOpen(false)}
                className="w-full h-12 rounded-xl font-bold text-sm"
                style={{ backgroundColor: '#F8F4FF', color: '#1A0A3D' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이모지 선택 팝업 */}
      {openCategory && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => { setOpenCategory(null); setPendingEmoji(null); }}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl flex flex-col"
            style={{ backgroundColor: '#F8F4FF', maxHeight: '60dvh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-4 shrink-0">
              <div onClick={() => { setOpenCategory(null); setPendingEmoji(null); }} className="w-10 h-1 rounded-full mx-auto mb-4 cursor-pointer" style={{ backgroundColor: '#D4C0F0' }} />
              <h2 className="text-base font-bold" style={{ color: '#1A0A3D' }}>
                {CATEGORY_META.find(m => m.key === openCategory)?.label} 반응 선택
              </h2>
            </div>

            <div className="overflow-y-auto px-6 pb-4">
              <div className="grid grid-cols-5 gap-3">
                {EMOJI_CATEGORIES[openCategory].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setPendingEmoji(pendingEmoji === emoji ? null : emoji)}
                    className="h-14 rounded-2xl text-2xl flex items-center justify-center active:opacity-70"
                    style={{
                      backgroundColor: pendingEmoji === emoji ? '#7B4DBE' : '#EDE0FF',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 pt-2 pb-10 shrink-0">
              <button
                onClick={handleReactionSubmit}
                disabled={!pendingEmoji || reacting}
                className="w-full h-12 rounded-xl font-bold text-sm disabled:opacity-40"
                style={{ backgroundColor: '#7B4DBE', color: '#F8F4FF' }}
              >
                {reacting ? '저장 중...' : '반응 남기기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
