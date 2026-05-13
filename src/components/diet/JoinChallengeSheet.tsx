'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { notifyUser } from '@/lib/notify';
import { useBackClose } from '@/hooks/useBackClose';

type Step = 'code' | 'confirm';
type ParticipantType = 'kakao' | 'nickname' | 'anonymous';

interface ChallengeInfo {
  id: string;
  title: string;
  target_date: string;
  target_weight: number;
  user_id: string;
  daysLeft: number;
  alreadyJoined: boolean;
}

export default function JoinChallengeSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('code');

  useBackClose(open, () => setOpen(false));
  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null);
  const [participantType, setParticipantType] = useState<ParticipantType | null>(null);
  const [anonymousName, setAnonymousName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  function openSheet() {
    setStep('code');
    setCode('');
    setSearchError(null);
    setChallenge(null);
    setParticipantType(null);
    setAnonymousName('');
    setJoinError(null);
    setJoining(false);
    setOpen(true);
  }

  function closeSheet() {
    setOpen(false);
  }

  const canJoin =
    participantType === 'kakao' ||
    participantType === 'nickname' ||
    (participantType === 'anonymous' && anonymousName.trim().length > 0);

  async function handleSearch() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 16) return;
    setSearching(true);
    setSearchError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSearching(false); return; }

    const { data } = await supabase
      .from('diet_challenges')
      .select('id, title, target_date, target_weight, user_id')
      .eq('invite_code', trimmed)
      .single();

    if (!data) {
      setSearchError('유효하지 않은 코드입니다.');
      setSearching(false);
      return;
    }

    if (data.user_id === user.id) {
      setSearchError('본인의 챌린지에는 참여할 수 없습니다.');
      setSearching(false);
      return;
    }

    const { data: existing } = await supabase
      .from('diet_participants')
      .select('id')
      .eq('challenge_id', data.id)
      .eq('user_id', user.id)
      .maybeSingle();

    const daysLeft = Math.ceil(
      (new Date(data.target_date as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    setChallenge({
      id: data.id as string,
      title: data.title as string,
      target_date: data.target_date as string,
      target_weight: data.target_weight as number,
      user_id: data.user_id as string,
      daysLeft,
      alreadyJoined: !!existing,
    });
    setStep('confirm');
    setSearching(false);
  }

  async function handleJoin() {
    if (!challenge || !canJoin) return;
    setJoining(true);
    setJoinError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setJoining(false); return; }

    const characterValue =
      participantType === 'anonymous' ? anonymousName.trim() : participantType!;

    const { error: insertErr } = await supabase.from('diet_participants').insert({
      challenge_id: challenge.id,
      user_id: user.id,
      character: characterValue,
    });

    if (insertErr) {
      setJoinError('참여 중 오류가 발생했습니다.');
      setJoining(false);
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
    const nickname = profile?.nickname ?? '누군가';
    notifyUser({
      targetUserId: challenge.user_id,
      title: '새로운 적이 나타났어요 ⚔️',
      body: `${nickname}님이 회원님의 챌린지에 참전했습니다!`,
      url: '/diet/my',
    });

    closeSheet();
    router.refresh();
  }

  const PROFILE_OPTIONS: { value: ParticipantType; label: string }[] = [
    { value: 'kakao', label: '카카오 프로필' },
    { value: 'nickname', label: '기본 닉네임' },
    { value: 'anonymous', label: '익명으로 참여' },
  ];

  return (
    <>
      <button
        onClick={openSheet}
        className="w-full h-13 rounded-2xl font-bold text-sm flex items-center justify-center border-2 active:opacity-70"
        style={{ borderColor: '#D4C0F0', color: '#A67FD4', backgroundColor: '#F8F4FF' }}
      >
        + 적 추가하기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={closeSheet}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl flex flex-col"
            style={{ backgroundColor: '#F8F4FF', maxHeight: '85dvh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 핸들 */}
            <div className="px-6 pt-5 pb-4 shrink-0">
              <div
                onClick={closeSheet}
                className="w-10 h-1 rounded-full mx-auto mb-4 cursor-pointer"
                style={{ backgroundColor: '#D4C0F0' }}
              />
              <h2 className="text-base font-bold" style={{ color: '#1A0A3D' }}>
                {step === 'code' ? '적 추가하기' : '챌린지 확인'}
              </h2>
            </div>

            <div className="overflow-y-auto px-6 pb-10 flex flex-col gap-5">
              {step === 'code' ? (
                <>
                  <p className="text-sm font-medium" style={{ color: '#A67FD4' }}>
                    시크릿 코드를 입력하세요
                  </p>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="XXXXXXXXXXXXXXXX"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    className="w-full h-14 px-4 rounded-xl text-center text-lg font-bold outline-none border"
                    style={{ backgroundColor: '#F8F4FF', color: '#4A2B8A', borderColor: '#D4C0F0', letterSpacing: '0.15em' }}
                    autoFocus
                  />
                  {searchError && (
                    <p className="text-sm text-center font-medium" style={{ color: '#F44336' }}>{searchError}</p>
                  )}
                  <button
                    onClick={handleSearch}
                    disabled={code.trim().length !== 16 || searching}
                    className="w-full h-12 rounded-xl font-bold text-sm transition-opacity active:opacity-70 disabled:opacity-40"
                    style={{ backgroundColor: '#7B4DBE', color: '#F8F4FF' }}
                  >
                    {searching ? '검색 중...' : '참여하기'}
                  </button>
                </>
              ) : challenge ? (
                <>
                  {/* 챌린지 정보 */}
                  <div
                    className="w-full rounded-2xl px-5 py-4 flex flex-col gap-3"
                    style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
                  >
                    <p className="text-xs font-medium" style={{ color: '#A67FD4' }}>챌린지</p>
                    <h3 className="text-base font-bold" style={{ color: '#1A0A3D' }}>{challenge.title}</h3>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={{ backgroundColor: '#EDE0FF', color: '#7B4DBE' }}
                      >
                        D-{challenge.daysLeft}일
                      </span>
                      <span className="text-sm font-medium" style={{ color: '#A67FD4' }}>
                        목표 {challenge.target_weight}kg
                      </span>
                    </div>
                  </div>

                  {challenge.alreadyJoined ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <p className="text-2xl">⚔️</p>
                      <p className="text-sm font-medium" style={{ color: '#A67FD4' }}>
                        이미 이 챌린지에 참여 중입니다.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-3">
                        <p className="text-sm font-semibold" style={{ color: '#1A0A3D' }}>아바타 선택</p>

                        <div className="flex gap-2">
                          {PROFILE_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setParticipantType(opt.value)}
                              className="flex-1 h-11 rounded-xl text-xs font-semibold transition-all active:opacity-75"
                              style={{
                                backgroundColor: participantType === opt.value ? '#7B4DBE' : '#EDE0FF',
                                color: participantType === opt.value ? '#F8F4FF' : '#7B4DBE',
                                border: `2px solid ${participantType === opt.value ? '#4A2B8A' : 'transparent'}`,
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {participantType === 'anonymous' && (
                          <input
                            type="text"
                            maxLength={20}
                            placeholder="익명 이름을 입력하세요"
                            value={anonymousName}
                            onChange={e => setAnonymousName(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl text-sm outline-none border"
                            style={{ backgroundColor: '#F8F4FF', color: '#1A0A3D', borderColor: '#D4C0F0' }}
                            autoFocus
                          />
                        )}
                      </div>

                      {joinError && (
                        <p className="text-sm text-center" style={{ color: '#F44336' }}>{joinError}</p>
                      )}

                      <button
                        onClick={handleJoin}
                        disabled={!canJoin || joining}
                        className="w-full h-12 rounded-xl font-bold text-sm transition-opacity active:opacity-70 disabled:opacity-40"
                        style={{ backgroundColor: '#7B4DBE', color: '#F8F4FF' }}
                      >
                        {joining ? '참여 중...' : '⚔️ 적으로 참여하기'}
                      </button>
                    </>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
