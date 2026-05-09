'use client';

import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { notifyUser } from '@/lib/notify';

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
  const dragStartY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
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

    const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
    const nickname = profile?.nickname ?? '누군가';
    notifyUser({
      targetUserId: challengeOwnerId,
      title: '새 댓글이 달렸어요 💬',
      body: `${nickname}: ${content.trim().slice(0, 40)}`,
      url: '/diet/my',
    });

    setContent('');
    setSubmitting(false);
    loadComments();
  }

  function onDragStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY;
  }

  function onDragMove(e: React.TouchEvent) {
    if (dragStartY.current === null || !sheetRef.current) return;
    const dy = e.touches[0].clientY - dragStartY.current;
    if (dy > 0) sheetRef.current.style.transform = `translateY(${dy}px)`;
  }

  function onDragEnd(e: React.TouchEvent) {
    if (dragStartY.current === null || !sheetRef.current) return;
    const dy = e.changedTouches[0].clientY - dragStartY.current;
    sheetRef.current.style.transform = '';
    if (dy > 80) setOpen(false);
    dragStartY.current = null;
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-full h-14 rounded-2xl font-bold text-sm transition-opacity active:opacity-70"
        style={{ backgroundColor: '#F7F7FC', color: '#1A1A2E', border: '1px solid #EBEBF5' }}
      >
        {buttonLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setOpen(false)}
        >
          <div
            ref={sheetRef}
            className="w-full max-w-[430px] rounded-t-3xl flex flex-col"
            style={{ backgroundColor: '#FFFFFF', maxHeight: '80dvh', transition: 'transform 0.15s ease' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 핸들 + 제목 — 드래그 영역 */}
            <div
              className="px-6 pt-5 pb-3 shrink-0 cursor-grab active:cursor-grabbing"
              onTouchStart={onDragStart}
              onTouchMove={onDragMove}
              onTouchEnd={onDragEnd}
            >
              <div
                onClick={() => setOpen(false)}
                className="w-10 h-1 rounded-full mx-auto mb-4 cursor-pointer"
                style={{ backgroundColor: '#EBEBF5' }}
              />
              <h2 className="text-base font-bold" style={{ color: '#1A1A2E' }}>댓글 게시판</h2>
            </div>

            {/* 댓글 목록 */}
            <div
              className="overflow-y-auto px-5 flex flex-col gap-2 pb-3"
              style={{ minHeight: 80, maxHeight: '45dvh' }}
            >
              {loading ? (
                <p className="text-sm text-center py-4" style={{ color: '#9898A6' }}>불러오는 중...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: '#9898A6' }}>아직 댓글이 없습니다.</p>
              ) : (
                comments.map(c => {
                  const isOwner = c.user_id === challengeOwnerId;
                  return (
                    <div
                      key={c.id}
                      className="flex flex-col gap-1 rounded-xl px-4 py-3"
                      style={{ backgroundColor: isOwner ? '#EDEAFF' : '#F7F7FC' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: isOwner ? '#7B6EF6' : '#1A1A2E' }}>
                          {c.nickname ?? '익명'}{isOwner && ' 👑'}
                        </span>
                        <span className="text-xs" style={{ color: '#BEBECE' }}>
                          {formatDate(c.created_at)}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: '#1A1A2E' }}>{c.content}</p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="shrink-0 mx-5 my-1" style={{ height: 1, backgroundColor: '#EBEBF5' }} />

            {/* 입력 영역 */}
            <div className="px-5 pt-3 pb-10 shrink-0 flex flex-col gap-3">
              <textarea
                rows={3}
                placeholder={placeholder}
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none border"
                style={{ backgroundColor: '#F7F7FC', color: '#1A1A2E', borderColor: '#EBEBF5' }}
              />
              {error && (
                <p className="text-xs font-medium" style={{ color: '#F44336' }}>{error}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-12 rounded-xl font-bold text-sm transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#7B6EF6', color: '#FFFFFF' }}
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
