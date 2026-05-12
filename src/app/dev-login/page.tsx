'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function DevLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin() {
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/diet/enemies');
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8 gap-4" style={{ backgroundColor: '#F8F4FF' }}>
      <p className="text-sm font-bold" style={{ color: '#7B4DBE' }}>DEV 로그인</p>
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="이메일"
        type="email"
        className="w-full max-w-xs border rounded-xl px-4 py-3 text-sm outline-none"
        style={{ borderColor: '#D4C0F0', color: '#1A0A3D' }}
      />
      <input
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="비밀번호"
        type="password"
        className="w-full max-w-xs border rounded-xl px-4 py-3 text-sm outline-none"
        style={{ borderColor: '#D4C0F0', color: '#1A0A3D' }}
      />
      {error && <p className="text-xs" style={{ color: '#E53935' }}>{error}</p>}
      <button
        onClick={handleLogin}
        className="w-full max-w-xs h-12 rounded-xl font-bold text-sm"
        style={{ backgroundColor: '#7B4DBE', color: '#F8F4FF' }}
      >
        로그인
      </button>
    </main>
  );
}
