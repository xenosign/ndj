'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { notifyUser } from '@/lib/notify';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_anonymous: boolean;
  nickname: string | null;
  avatarUrl: string | null;
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
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { data } = await supabase
      .from('diet_comments')
      .select('id, content, created_at, is_anonymous, user_id')
      .eq('challenge_id', challengeId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!data) { setLoading(false); return; }

    const allUserIds = [...new Set(data.map(c => c.user_id as string))];
    const nonAnonIds = [...new Set(
      data.filter(c => !c.is_anonymous).map(c => c.user_id as string)
    )];
    const [{ data: profiles }, { data: participantRows }] = await Promise.all([
      nonAnonIds.length > 0
        ? supabase.from('profiles').select('id, nickname, avatar_url').in('id', nonAnonIds)
        : { data: [] },
      allUserIds.length > 0
        ? supabase.from('diet_participants').select('user_id, character').eq('challenge_id', challengeId).in('user_id', allUserIds)
        : { data: [] },
    ]);

    const profileMap = Object.fromEntries(
      (profiles ?? []).map(p => [p.id as string, p])
    );
    const characterMap = Object.fromEntries(
      (participantRows ?? []).map(p => [p.user_id as string, p.character as string | null])
    );

    setComments(data.map(c => {
      const uid = c.user_id as string;
      const anon = c.is_anonymous as boolean;
      const character = characterMap[uid];
      const isAnonymousParticipant = character && character !== 'kakao' && character !== 'nickname';
      const profile = (!anon && !isAnonymousParticipant) ? profileMap[uid] : null;
      return {
        id: c.id as string,
        user_id: uid,
        content: c.content as string,
        created_at: c.created_at as string,
        is_anonymous: anon && !isAnonymousParticipant,
        nickname: isAnonymousParticipant ? character : (anon ? null : ((profile?.nickname as string | null) ?? null)),
        avatarUrl: (anon || isAnonymousParticipant) ? null : ((profile?.avatar_url as string | null) ?? null),
      };
    }));
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
      is_anonymous: isAnonymous,
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

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-3/5 mx-auto block text-xs font-bold px-3 py-2 rounded-xl transition-opacity active:opacity-75"
        style={{ backgroundColor: '#4A2B8A', color: '#F8F4FF' }}
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
            className="w-full max-w-[430px] rounded-t-3xl flex flex-col"
            style={{ backgroundColor: '#F8F4FF', maxHeight: '80dvh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 핸들 + 제목 */}
            <div
              className="px-6 pt-5 pb-3 shrink-0"
            >
              <div
                onClick={() => setOpen(false)}
                className="w-10 h-1 rounded-full mx-auto mb-4 cursor-pointer"
                style={{ backgroundColor: '#D4C0F0' }}
              />
              <h2 className="text-base font-bold" style={{ color: '#1A0A3D' }}>댓글 게시판</h2>
            </div>

            {/* 댓글 목록 */}
            <div
              className="overflow-y-auto px-5 flex flex-col gap-2 pb-3"
              style={{ minHeight: 80, maxHeight: '45dvh' }}
            >
              {loading ? (
                <p className="text-sm text-center py-4" style={{ color: '#A67FD4' }}>불러오는 중...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: '#A67FD4' }}>아직 댓글이 없습니다.</p>
              ) : (
                comments.map(c => {
                  const isOwner = c.user_id === challengeOwnerId;
                  const initial = c.nickname?.[0] ?? '?';
                  return (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 rounded-xl px-4 py-3"
                      style={{ backgroundColor: isOwner ? '#EDE0FF' : '#F8F4FF' }}
                    >
                      {/* 아바타 */}
                      <div
                        className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: c.is_anonymous && !c.nickname ? '#D4C0F0' : '#EDE0FF' }}
                      >
                        {!c.is_anonymous && c.avatarUrl?.startsWith('http') ? (
                          <Image src={c.avatarUrl} alt={c.nickname ?? ''} width={32} height={32} className="object-cover w-full h-full" />
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#7B4DBE' }}>
                            {c.is_anonymous && !c.nickname ? '?' : initial}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold" style={{ color: isOwner ? '#7B4DBE' : '#1A0A3D' }}>
                            {c.is_anonymous && !c.nickname ? '익명' : (c.nickname ?? '익명')}{isOwner && ' 👑'}
                          </span>
                          <span className="text-xs shrink-0" style={{ color: '#C4A0E8' }}>
                            {formatDate(c.created_at)}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: '#1A0A3D' }}>{c.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="shrink-0 mx-5 my-1" style={{ height: 1, backgroundColor: '#D4C0F0' }} />

            {/* 입력 영역 */}
            <div className="px-5 pt-3 pb-10 shrink-0 flex flex-col gap-3">
              <textarea
                rows={3}
                placeholder={placeholder}
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none border"
                style={{ backgroundColor: '#F8F4FF', color: '#1A0A3D', borderColor: '#D4C0F0' }}
              />
              <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                <div
                  onClick={() => setIsAnonymous(prev => !prev)}
                  className="w-10 h-6 rounded-full relative transition-colors"
                  style={{ backgroundColor: isAnonymous ? '#7B4DBE' : '#D4C0F0' }}
                >
                  <div
                    className="absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-200"
                    style={{
                      backgroundColor: '#F8F4FF',
                      transform: isAnonymous ? 'translateX(16px)' : 'translateX(0)',
                    }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: '#4A2B8A' }}>익명</span>
              </label>
              {error && (
                <p className="text-xs font-medium" style={{ color: '#F44336' }}>{error}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-12 rounded-xl font-bold text-sm transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#7B4DBE', color: '#F8F4FF' }}
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
