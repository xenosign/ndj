import KakaoLoginButton from "@/components/auth/KakaoLoginButton";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl font-bold">NDJ App</h1>
      <KakaoLoginButton />
    </main>
  );
}
