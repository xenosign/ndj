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
      className='px-6 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors'
    >
      로그아웃
    </button>
  );
}
