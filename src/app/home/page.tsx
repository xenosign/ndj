import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import TopHeader from '@/components/layout/TopHeader';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasChallenge = false;
  if (user) {
    const { data } = await supabase
      .from('diet_challenges')
      .select('id')
      .eq('user_id', user.id)
      .single();
    hasChallenge = !!data;
  }

  return (
    <main
      className="flex flex-1 flex-col"
      style={{ backgroundColor: '#F8F4FF' }}
    >
      <TopHeader showBack={false} />
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10">
        {/* 로고 */}
        <div className="flex flex-col items-center gap-4 mb-2">
          <Image
            src="/WEGOBE-logo-512.png"
            alt="WEGOBE 로고"
            width={300}
            height={300}
            style={{ borderRadius: '4rem' }}
            priority
          />
          <div className="flex flex-col items-center gap-1">
            <p
              className="text-medium font-medium text-center"
              style={{ color: '#1A0A3D' }}
            >
              네 다이어트를 적에게 알려라
            </p>
          </div>
        </div>

        {/* 카드 섹션 */}
        <div className="w-full flex flex-col gap-3">
          <Link
            href={hasChallenge ? '/diet/my' : '/diet/start'}
            className="w-full rounded-2xl px-6 py-5 flex flex-col gap-1 active:opacity-70"
            style={{ backgroundColor: '#7B4DBE' }}
          >
            <span className="text-base font-bold" style={{ color: '#F8F4FF' }}>
              {hasChallenge ? '⚖️ 내 다이어트 현황' : '🚀 내 다이어트 시작하기'}
            </span>
            <span className="text-xs font-medium" style={{ color: '#EDE0FF' }}>
              {hasChallenge
                ? '오늘의 체중 및 미션을 기록하고 진행 상황 및 적들의 반응을 확인하세요'
                : '목표를 설정하고 다이어트를 시작하세요'}
            </span>
          </Link>

          <Link
            href="/diet/enemies"
            className="w-full rounded-2xl px-6 py-5 flex flex-col gap-1 active:opacity-70"
            style={{
              backgroundColor: '#F8F4FF',
              boxShadow: '0 4px 20px rgba(123,77,190,0.28)',
              border: '1.5px solid #D4C0F0',
            }}
          >
            <span className="text-base font-bold" style={{ color: '#1A0A3D' }}>
              ⚔️ 적들의 다이어트
            </span>
            <span className="text-xs font-medium" style={{ color: '#A67FD4' }}>
              참여 중인 적들의 챌린지를 확인하고 반응 및 댓글을 남기세요
            </span>
          </Link>

          {!hasChallenge && (
            <Link
              href="/diet/join"
              className="w-full rounded-2xl px-6 py-5 flex flex-col gap-1 active:opacity-70"
              style={{
                backgroundColor: '#F8F4FF',
                boxShadow: '0 4px 20px rgba(123,77,190,0.28)',
                border: '1.5px solid #D4C0F0',
              }}
            >
              <span
                className="text-base font-bold"
                style={{ color: '#1A0A3D' }}
              >
                🤝 적 다이어트 참여하기
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: '#A67FD4' }}
              >
                초대 코드로 친구의 다이어트에 참여하세요
              </span>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
