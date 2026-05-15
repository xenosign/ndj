'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import CommentBoard from '@/components/diet/CommentBoard';

interface CommentItem {
  id: string;
  content: string;
  is_anonymous: boolean;
  nickname: string | null;
  avatarUrl: string | null;
}

function CommentAvatar({
  avatarUrl,
  nickname,
  isAnonymous,
}: {
  avatarUrl: string | null;
  nickname: string | null;
  isAnonymous: boolean;
}) {
  const initial = nickname?.[0] ?? '?';

  if (isAnonymous) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: '#D4C0F0' }}
      >
        <span style={{ fontSize: nickname ? 12 : 14, fontWeight: 700, color: '#7B4DBE' }}>
          {nickname ? nickname[0] : '?'}
        </span>
      </div>
    );
  }

  return (
    <div
      className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0"
      style={{ backgroundColor: '#EDE0FF' }}
    >
      {avatarUrl?.startsWith('http') ? (
        <Image
          src={avatarUrl}
          alt={nickname ?? ''}
          width={32}
          height={32}
          className="object-cover w-full h-full"
        />
      ) : (
        <span style={{ fontSize: 12, fontWeight: 700, color: '#7B4DBE' }}>{initial}</span>
      )}
    </div>
  );
}

interface Props {
  challengeId: string;
  challengeOwnerId: string;
}

export default function CommentCard({ challengeId, challengeOwnerId }: Props) {
  const [comments, setComments] = useState<CommentItem[]>([]);

  const fetchComments = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('diet_comments')
      .select('id, content, is_anonymous, user_id')
      .eq('challenge_id', challengeId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!data) return;

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

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id as string, p]));
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
        content: c.content as string,
        is_anonymous: anon && !isAnonymousParticipant,
        nickname: isAnonymousParticipant ? character : (anon ? null : ((profile?.nickname as string | null) ?? null)),
        avatarUrl: (anon || isAnonymousParticipant) ? null : ((profile?.avatar_url as string | null) ?? null),
      };
    }));
  }, [challengeId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  return (
    <div
      className="rounded-2xl px-5 py-4 flex flex-col gap-3"
      style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
    >
      {comments.map(c => (
        <div key={c.id} className="flex items-center gap-3">
          <CommentAvatar
            avatarUrl={c.avatarUrl}
            nickname={c.nickname}
            isAnonymous={c.is_anonymous}
          />
          <span className="text-xs truncate flex-1" style={{ color: '#4A2B8A' }}>
            {c.content}
          </span>
        </div>
      ))}

      {comments.length === 0 && (
        <p className="text-xs text-center py-1" style={{ color: '#A67FD4' }}>아직 댓글이 없어요</p>
      )}

      <CommentBoard
        challengeId={challengeId}
        challengeOwnerId={challengeOwnerId}
        buttonLabel="💬 적들의 댓글 보기"
        placeholder="적들에게 한마디..."
        onClose={fetchComments}
      />
    </div>
  );
}
