"use client";

export default function LogoutButton() {
  function handleLogout() {
    const kakaoRestApiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
    const logoutRedirectUri = `${window.location.origin}/auth/kakao/logout`;

    window.location.href = `https://kauth.kakao.com/oauth/logout?client_id=${kakaoRestApiKey}&logout_redirect_uri=${logoutRedirectUri}`;
  }

  return (
    <button
      onClick={handleLogout}
      className="px-6 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      로그아웃
    </button>
  );
}
