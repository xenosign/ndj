'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const LABEL = '#E8D5B0';

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
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-bold px-1" style={{ color: LABEL }}>닉네임</h2>

      {editing ? (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            maxLength={20}
            placeholder="닉네임 입력"
            className="w-full px-4 h-12 rounded-xl text-sm outline-none"
            style={{ backgroundColor: '#3D2510', color: '#FAFAF7' }}
          />
          {error && <p className="text-xs px-1" style={{ color: '#F5A58A' }}>{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => { setEditing(false); setInput(nickname); setError(null); }}
              className="flex-1 h-11 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85"
              style={{ backgroundColor: '#3D2510', color: LABEL }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-11 rounded-xl text-sm font-bold transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ backgroundColor: '#F2C14E', color: '#2C1A0E' }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setInput(nickname); setEditing(true); }}
          className="w-full rounded-2xl px-5 py-4 flex items-center justify-between transition-opacity hover:opacity-85 active:opacity-70"
          style={{ backgroundColor: '#3D2510' }}
        >
          <span className="text-base font-semibold" style={{ color: nickname ? '#FAFAF7' : '#7B4A2D' }}>
            {nickname || '닉네임 없음'}
          </span>
          <span className="text-xs font-medium" style={{ color: '#C47B3A' }}>수정</span>
        </button>
      )}
    </section>
  );
}
