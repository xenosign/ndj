'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  nickname: string | null;
}

interface Props {
  challengeId: string;
  challengeOwnerId: string;
  buttonLabel: string;
  placeholder?: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function CommentBoard({ challengeId, challengeOwnerId, buttonLabel, placeholder = '적에게 한마디...' }: Props) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { data } = await supabase
      .from('diet_comments')
      .select('id, content, created_at, user_id')
      .eq('challenge_id', challengeId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!data) { setLoading(false); return; }

    const userIds = [...new Set(data.map(c => c.user_id as string))];
    const { data: profiles } = userIds.length > 0
      ? await supabase.from('profiles').select('id, nickname').in('id', userIds)
      : { data: [] };

    const nicknameMap = Object.fromEntries(
      (profiles ?? []).map(p => [p.id as string, p.nickname as string | null])
    );

    setComments(data.map(c => ({
      id: c.id as string,
      user_id: c.user_id as string,
      content: c.content as string,
      created_at: c.created_at as string,
      nickname: nicknameMap[c.user_id as string] ?? null,
    })));
    setLoading(false);
  }, [challengeId]);

  function handleOpen() {
    setContent('');
    setError(null);
    setOpen(true);
    loadComments();
  }

  async function handleSubmit() {
    if (!content.trim()) { setError('내용을 입력해주세요.'); return; }
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
      setError('등록 중 오류가 발생했습니다.');
      setSubmitting(false);
      return;
    }

    setContent('');
    setSubmitting(false);
    loadComments();
  }

  const LABEL_COLOR = '#E8D5B0';

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-full rounded-2xl font-semibold text-sm py-4 transition-opacity hover:opacity-85 active:opacity-70"
        style={{ backgroundColor: '#F5A58A', color: '#2C1A0E' }}
      >
        {buttonLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl flex flex-col"
            style={{ backgroundColor: '#3D2510', maxHeight: '80dvh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 핸들 + 제목 */}
            <div className="px-6 pt-5 pb-3 shrink-0">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: '#7B4A2D' }} />
              <h2 className="text-base font-bold" style={{ color: '#F2C14E' }}>댓글 게시판</h2>
            </div>

            {/* 댓글 목록 — 스크롤 */}
            <div
              className="overflow-y-auto px-6 flex flex-col gap-3 pb-3"
              style={{ minHeight: 80, maxHeight: '45dvh' }}
            >
              {loading ? (
                <p className="text-sm text-center py-4" style={{ color: LABEL_COLOR }}>불러오는 중...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: LABEL_COLOR }}>아직 댓글이 없습니다.</p>
              ) : (
                comments.map(c => {
                  const isOwner = c.user_id === challengeOwnerId;
                  return (
                    <div
                      key={c.id}
                      className="flex flex-col gap-1 rounded-xl px-4 py-3"
                      style={{ backgroundColor: isOwner ? '#5C3418' : '#2C1A0E' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: isOwner ? '#F2C14E' : '#C47B3A' }}>
                          {c.nickname ?? '익명'}{isOwner && ' 👑'}
                        </span>
                        <span className="text-xs" style={{ color: '#7B4A2D' }}>
                          {formatDate(c.created_at)}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: LABEL_COLOR }}>{c.content}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* 구분선 */}
            <div className="shrink-0 mx-6 my-1" style={{ height: 1, backgroundColor: '#7B4A2D' }} />

            {/* 입력 영역 */}
            <div className="px-6 pt-3 pb-10 shrink-0 flex flex-col gap-3">
              <textarea
                rows={3}
                placeholder={placeholder}
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ backgroundColor: '#2C1A0E', color: '#FAFAF7' }}
              />
              {error && (
                <p className="text-xs font-medium" style={{ color: '#F5A58A' }}>{error}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-12 rounded-xl font-bold text-sm transition-opacity hover:opacity-85 active:opacity-70 disabled:opacity-50"
                style={{ backgroundColor: '#F2C14E', color: '#2C1A0E' }}
              >
                {submitting ? '등록 중...' : '댓글 등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
