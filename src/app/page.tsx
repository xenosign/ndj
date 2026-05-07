"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      router.replace(user ? "/home" : "/login");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-white">
      <Image
        src="/ndj.webp"
        alt="NDJ"
        width={200}
        height={200}
        priority
        className="animate-pulse"
      />
    </main>
  );
}
