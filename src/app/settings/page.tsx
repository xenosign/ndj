import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import TopHeader from '@/components/layout/TopHeader';
import LogoutButton from '@/components/auth/LogoutButton';
import DietDeleteButton from '@/components/settings/DietDeleteButton';

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: challenge } = await supabase
    .from('diet_challenges')
    .select('id, title, target_date, status')
    .eq('user_id', user.id)
    .single();

  const LABEL = '#E8D5B0';

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#2C1A0E' }}>
      <TopHeader title="환경설정" showBack={false} />

      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6">

        {/* 내 다이어트 관리 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold px-1" style={{ color: LABEL }}>
            내 다이어트 관리
          </h2>

          {challenge ? (
            <div className="flex flex-col gap-3">
              {/* 현재 챌린지 정보 */}
              <div
                className="w-full rounded-2xl px-5 py-4 flex flex-col gap-1"
                style={{ backgroundColor: '#3D2510' }}
              >
                <p className="text-xs font-medium" style={{ color: LABEL }}>진행 중</p>
                <p className="text-base font-bold" style={{ color: '#F2C14E' }}>
                  {challenge.title}
                </p>
                <p className="text-xs" style={{ color: LABEL }}>
                  목표일 {new Date(challenge.target_date).toLocaleDateString('ko-KR')}
                </p>
              </div>

              {/* 수정 버튼 */}
              <Link
                href="/diet/edit"
                className="w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center transition-opacity hover:opacity-85 active:opacity-70"
                style={{ backgroundColor: '#3D2510', color: '#F2C14E' }}
              >
                ✏️ 다이어트 수정
              </Link>

              {/* 삭제 버튼 */}
              <DietDeleteButton challengeId={challenge.id} />
            </div>
          ) : (
            <div
              className="w-full rounded-2xl px-5 py-5 flex flex-col items-center gap-3"
              style={{ backgroundColor: '#3D2510' }}
            >
              <p className="text-sm font-medium" style={{ color: LABEL }}>
                진행 중인 다이어트가 없습니다.
              </p>
              <Link
                href="/diet/start"
                className="h-11 px-6 rounded-xl text-sm font-semibold flex items-center justify-center transition-opacity hover:opacity-85"
                style={{ backgroundColor: '#F2C14E', color: '#2C1A0E' }}
              >
                다이어트 시작하기
              </Link>
            </div>
          )}
        </section>

        {/* 구분선 */}
        <div style={{ height: 1, backgroundColor: '#3D2510' }} />

        {/* 계정 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold px-1" style={{ color: LABEL }}>
            계정
          </h2>
          <LogoutButton />
        </section>

      </div>
    </main>
  );
}
