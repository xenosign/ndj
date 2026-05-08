import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

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
      className='flex flex-1 flex-col'
      style={{ backgroundColor: '#2C1A0E' }}
    >
      <div className='flex flex-1 flex-col items-center justify-center gap-4 p-8'>
        <Image
          src='/ndj-logo-512.png'
          alt='NDJ 로고'
          width={430}
          height={430}
          className='mb-4 rounded-3xl'
          priority
        />
        <Link
          href={hasChallenge ? '/diet/my' : '/diet/start'}
          className='flex items-center justify-center w-full max-w-sm h-14 rounded-xl font-semibold text-base transition-opacity hover:opacity-85 active:opacity-70'
          style={{ backgroundColor: '#F2C14E', color: '#2C1A0E' }}
          checkflow="signup" 
        >
          {hasChallenge ? '내 다이어트로 이동' : '내 다이어트 시작하기'}
        </Link>
        <Link
          href='/diet/enemies'
          className='flex items-center justify-center w-full max-w-sm h-14 rounded-xl font-semibold text-base transition-opacity hover:opacity-85 active:opacity-70'
          style={{ backgroundColor: '#C47B3A', color: '#FAFAF7' }}
          checkflow="signup" 
        >
          적들의 다이어트 보기
        </Link>
      </div>
    </main>
  );
}
