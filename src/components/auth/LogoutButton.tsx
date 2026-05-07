'use client';

import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  async function handleLogout() {
    // 1. Supabase 세션 먼저 제거
    const supabase = createClient();
    await supabase.auth.signOut();

    // 2. 카카오 세션 제거 → origin 으로 리다이렉트
    const kakaoRestApiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
    const logoutRedirectUri = `${window.location.origin}`;

    window.location.href = `https://kauth.kakao.com/oauth/logout?client_id=${kakaoRestApiKey}&logout_redirect_uri=${logoutRedirectUri}`;
  }

  return (
    <button
      onClick={handleLogout}
      className='flex items-center justify-center gap-3 w-full max-w-sm h-14 rounded-xl font-semibold text-base transition-opacity hover:opacity-90 active:opacity-80'
      style={{ backgroundColor: '#FEE500', color: '#191919' }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.6 5.1 4 6.6l-.9 3.4c-.1.3.3.6.5.4l4-2.6c.4.1.9.1 1.4.1 5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
      </svg>
      카카오 로그아웃
    </button>
  );
}
