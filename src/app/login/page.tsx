import KakaoLoginButton from "@/components/auth/KakaoLoginButton";

export default function LoginPage() {
  return (
    <main
      className="flex flex-1 flex-col items-end justify-end p-8 pb-12"
      style={{
        backgroundImage: "url('/ndj.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <KakaoLoginButton />
    </main>
  );
}
