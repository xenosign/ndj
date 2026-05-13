'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBackClose } from '@/hooks/useBackClose';

export default function EnemyCommentButton({ challengeId }: { challengeId: string }) {
  const [open, setOpen] = useState(false);
  useBackClose(open, () => setOpen(false));
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!content.trim()) { setError('댓글을 입력해주세요.'); return; }
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    const { error: insertErr } = await supabase.from('diet_comments').insert({
      challenge_id: challengeId,
      user_id: user.id,
      content: content.trim(),
    });

    if (insertErr) {
      setError('댓글 등록 중 오류가 발생했습니다.');
      setSubmitting(false);
      return;
    }

    setDone(true);
    setContent('');
    setTimeout(() => { setOpen(false); setDone(false); }, 1000);
    setSubmitting(false);
  }

  return (
    <>
      <button
        onClick={() => { setContent(''); setError(null); setDone(false); setOpen(true); }}
        className="w-full rounded-2xl font-semibold text-sm py-4 transition-opacity hover:opacity-85 active:opacity-70"
        style={{ backgroundColor: '#C4A0E8', color: '#1A0A3D' }}
      >
        🔥 적에게 댓글 달기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl px-6 pt-5 pb-10 flex flex-col gap-5"
            style={{ backgroundColor: '#2A1560' }}
            onClick={e => e.stopPropagation()}
          >
            <div
              onClick={() => setOpen(false)}
              className="w-10 h-1 rounded-full mx-auto cursor-pointer"
              style={{ backgroundColor: '#4A2B8A' }}
            />

            <h2 className="text-base font-bold" style={{ color: '#A67FD4' }}>
              적에게 댓글 달기
            </h2>

            {done ? (
              <p className="text-center text-base font-semibold" style={{ color: '#A67FD4' }}>
                🔥 댓글이 등록되었습니다!
              </p>
            ) : (
              <>
                <textarea
                  rows={4}
                  placeholder="적에게 한마디..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ backgroundColor: '#1A0A3D', color: '#F8F4FF' }}
                  autoFocus
                />
                {error && (
                  <p className="text-xs font-medium" style={{ color: '#C4A0E8' }}>{error}</p>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full h-13 rounded-xl font-bold text-sm transition-opacity hover:opacity-85 active:opacity-70 disabled:opacity-50"
                  style={{ backgroundColor: '#A67FD4', color: '#1A0A3D' }}
                >
                  {submitting ? '등록 중...' : '댓글 등록'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
