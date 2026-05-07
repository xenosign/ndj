import KakaoLoginButton from "@/components/auth/KakaoLoginButton";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-12 p-8">
      <Image
        src="/ndj.webp"
        alt="NDJ"
        width={120}
        height={120}
        priority
      />
      <KakaoLoginButton />
    </main>
  );
}
