'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import ScrollableArea from '@/components/layout/ScrollableArea';
import TopHeader from '@/components/layout/TopHeader';
import LogoutButton from '@/components/auth/LogoutButton';
import DietDeleteButton from '@/components/settings/DietDeleteButton';
import NicknameEditor from '@/components/settings/NicknameEditor';

type PageData = {
  nickname: string | null;
  challenge: {
    id: string;
    title: string;
    target_date: string;
    status: string;
  } | null;
};

function Skeleton() {
  const pulse = 'animate-pulse rounded-xl';
  const bar = (w: string, h = 'h-4') =>
    <div className={`${pulse} ${h} ${w}`} style={{ backgroundColor: '#D4C0F0' }} />;

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#F8F4FF' }}>
      <TopHeader title="설정" showBack={false} />
      <ScrollableArea>
        <div className="px-4 py-5 flex flex-col gap-4 pb-8">

          {/* NicknameEditor 스켈레톤 */}
          <div
            className="rounded-2xl px-5 py-4 flex flex-col gap-3"
            style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
          >
            {bar('w-20 h-3')}
            <div className={`${pulse} h-11 w-full rounded-xl`} style={{ backgroundColor: '#D4C0F0' }} />
          </div>

          {/* 내 다이어트 관리 스켈레톤 */}
          <div
            className="rounded-2xl px-5 py-4 flex flex-col gap-3"
            style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
          >
            {bar('w-28 h-3')}
            <div className={`${pulse} h-20 w-full rounded-xl`} style={{ backgroundColor: '#D4C0F0' }} />
            <div className={`${pulse} h-11 w-full rounded-xl`} style={{ backgroundColor: '#D4C0F0' }} />
          </div>

          {/* 계정 스켈레톤 */}
          <div
            className="rounded-2xl px-5 py-4 flex flex-col gap-3"
            style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
          >
            {bar('w-12 h-3')}
            <div className={`${pulse} h-11 w-full rounded-xl`} style={{ backgroundColor: '#D4C0F0' }} />
          </div>

        </div>
      </ScrollableArea>
    </main>
  );
}

export default function SettingsPageClient({ userId }: { userId: string }) {
  const [data, setData] = useState<PageData | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchAll() {
      const [
        { data: profile },
        { data: challenge },
      ] = await Promise.all([
        supabase.from('profiles').select('nickname').eq('id', userId).single(),
        supabase
          .from('diet_challenges')
          .select('id, title, target_date, status')
          .eq('user_id', userId)
          .single(),
      ]);

      setData({
        nickname: (profile?.nickname as string | null) ?? null,
        challenge: challenge as PageData['challenge'],
      });
    }

    fetchAll();
  }, [userId]);

  if (!data) return <Skeleton />;

  const { nickname, challenge } = data;

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#F8F4FF' }}>
      <TopHeader title="설정" showBack={false} />

      <ScrollableArea>
        <div className="px-4 py-5 flex flex-col gap-4 pb-8">

          {/* 닉네임 */}
          <NicknameEditor initialNickname={nickname} />

          {/* 내 다이어트 관리 */}
          <div
            className="rounded-2xl px-5 py-4 flex flex-col gap-3"
            style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
          >
            <h2 className="text-sm font-bold" style={{ color: '#A67FD4' }}>내 다이어트 관리</h2>

            {challenge ? (
              <>
                <div
                  className="rounded-xl px-4 py-3 flex flex-col gap-1"
                  style={{ backgroundColor: '#F8F4FF' }}
                >
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full self-start" style={{ backgroundColor: '#EDE0FF', color: '#7B4DBE' }}>진행 중</span>
                  <p className="text-base font-bold mt-1" style={{ color: '#1A0A3D' }}>{challenge.title}</p>
                  <p className="text-xs" style={{ color: '#A67FD4' }}>
                    목표일 {new Date(challenge.target_date).toLocaleDateString('ko-KR')}
                  </p>
                </div>

                <Link
                  href="/diet/edit"
                  className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center active:opacity-70"
                  style={{ backgroundColor: '#EDE0FF', color: '#7B4DBE' }}
                >
                  ✏️ 다이어트 수정
                </Link>

                <DietDeleteButton challengeId={challenge.id} />
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-3">
                <p className="text-sm font-medium" style={{ color: '#A67FD4' }}>
                  진행 중인 다이어트가 없습니다.
                </p>
                <Link
                  href="/diet/start"
                  className="h-11 px-6 rounded-xl text-sm font-bold flex items-center justify-center active:opacity-70"
                  style={{ backgroundColor: '#7B4DBE', color: '#F8F4FF' }}
                >
                  다이어트 시작하기
                </Link>
              </div>
            )}
          </div>

          {/* 계정 */}
          <div
            className="rounded-2xl px-5 py-4 flex flex-col gap-3"
            style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
          >
            <h2 className="text-sm font-bold" style={{ color: '#A67FD4' }}>계정</h2>
            <LogoutButton />
          </div>

          {/* DEV 전용 */}
          {process.env.NODE_ENV === 'development' && (
            <Link
              href="/dev-login"
              className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center active:opacity-70"
              style={{ backgroundColor: '#EDE0FF', color: '#A67FD4' }}
            >
              🛠 테스트 로그인
            </Link>
          )}

        </div>
      </ScrollableArea>
    </main>
  );
}
