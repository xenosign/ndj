'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DietDeleteButton({ challengeId }: { challengeId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from('diet_challenges').delete().eq('id', challengeId);
    router.push('/home');
  }

  if (confirm) {
    return (
      <div
        className="w-full rounded-2xl p-5 flex flex-col gap-3"
        style={{ backgroundColor: '#3D2510' }}
      >
        <p className="text-sm font-semibold text-center" style={{ color: '#F5A58A' }}>
          정말 삭제하시겠습니까?
        </p>
        <p className="text-xs text-center" style={{ color: '#E8D5B0' }}>
          삭제 시 모든 기록이 사라지고 복구할 수 없습니다.
        </p>
        <div className="flex gap-3 mt-1">
          <button
            onClick={() => setConfirm(false)}
            className="flex-1 h-11 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#7B4A2D', color: '#F4E6C6' }}
          >
            취소
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 h-11 rounded-xl text-sm font-bold transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ backgroundColor: '#F5A58A', color: '#2C1A0E' }}
          >
            {loading ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="w-full h-12 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85 active:opacity-70"
      style={{ backgroundColor: '#3D2510', color: '#F5A58A' }}
    >
      🗑 다이어트 삭제
    </button>
  );
}
