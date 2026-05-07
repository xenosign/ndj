"use client";

import { signInWithOAuth } from "@/utils/auth";

export default function KakaoLoginButton() {
  async function handleKakaoLogin() {
    try {
      await signInWithOAuth("kakao");
    } catch (error) {
      console.error("카카오 로그인 실패:", error);
    }
  }

  return (
    <button
      onClick={handleKakaoLogin}
      className="flex items-center justify-center gap-3 w-full max-w-sm h-14 rounded-xl font-semibold text-base transition-opacity hover:opacity-90 active:opacity-80"
      style={{ backgroundColor: "#FEE500", color: "#191919" }}
    >
      {/* 카카오 로고 */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.6 5.1 4 6.6l-.9 3.4c-.1.3.3.6.5.4l4-2.6c.4.1.9.1 1.4.1 5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
      </svg>
      카카오로 시작하기
    </button>
  );
}
