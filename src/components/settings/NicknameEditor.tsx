'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function NicknameEditor({ initialNickname }: { initialNickname: string | null }) {
  const [nickname, setNickname] = useState(initialNickname ?? '');
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(initialNickname ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!input.trim()) { setError('닉네임을 입력해주세요.'); return; }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error: upsertErr } = await supabase
      .from('profiles')
      .upsert({ id: user.id, nickname: input.trim() }, { onConflict: 'id' });

    if (upsertErr) {
      setError(`저장 중 오류: ${upsertErr.message}`);
      setSaving(false);
      return;
    }

    setNickname(input.trim());
    setEditing(false);
    setSaving(false);
  }

  return (
    <div
      className="rounded-2xl px-5 py-4 flex flex-col gap-3"
      style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
    >
      <h2 className="text-sm font-bold" style={{ color: '#A67FD4' }}>닉네임</h2>

      {editing ? (
        <>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            maxLength={20}
            placeholder="닉네임 입력"
            className="w-full px-4 h-12 rounded-xl text-sm outline-none border"
            style={{ backgroundColor: '#F8F4FF', color: '#1A0A3D', borderColor: '#D4C0F0' }}
          />
          {error && <p className="text-xs px-1" style={{ color: '#F44336' }}>{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => { setEditing(false); setInput(nickname); setError(null); }}
              className="flex-1 h-11 rounded-xl text-sm font-semibold active:opacity-70"
              style={{ backgroundColor: '#F8F4FF', color: '#A67FD4' }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-11 rounded-xl text-sm font-bold active:opacity-70 disabled:opacity-50"
              style={{ backgroundColor: '#7B4DBE', color: '#F8F4FF' }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => { setInput(nickname); setEditing(true); }}
          className="w-full rounded-xl px-4 py-3 flex items-center justify-between active:opacity-70"
          style={{ backgroundColor: '#F8F4FF' }}
        >
          <span className="text-base font-semibold" style={{ color: nickname ? '#1A0A3D' : '#C4A0E8' }}>
            {nickname || '닉네임 없음'}
          </span>
          <span className="text-xs font-semibold" style={{ color: '#7B4DBE' }}>수정</span>
        </button>
      )}
    </div>
  );
}
