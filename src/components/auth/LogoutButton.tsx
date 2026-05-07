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
      className='flex items-center justify-center gap-3 w-full h-12 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-80'
      style={{ backgroundColor: '#3D2510', color: '#F5A58A' }}
    >
      로그아웃
    </button>
  );
}
