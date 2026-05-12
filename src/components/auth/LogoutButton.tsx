'use client';

import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();

    const kakaoRestApiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
    const logoutRedirectUri = `${window.location.origin}`;

    window.location.href = `https://kauth.kakao.com/oauth/logout?client_id=${kakaoRestApiKey}&logout_redirect_uri=${logoutRedirectUri}`;
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full h-11 rounded-xl font-semibold text-sm active:opacity-70"
      style={{ backgroundColor: '#4A2B8A', color: '#F8F4FF' }}
    >
      로그아웃
    </button>
  );
}
