'use client';

import ScrollableArea from '@/components/layout/ScrollableArea';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => chars[b % chars.length]).join('');
}

export default function DietStartPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    startWeight: '',
    targetWeight: '',
    targetDate: '',
    deposit: '',
  });

  function setField(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    const { title, startWeight, targetWeight, targetDate } = form;
    if (!title || !startWeight || !targetWeight || !targetDate) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // 챌린지 생성
      const { data: challenge, error: challengeErr } = await supabase
        .from('diet_challenges')
        .insert({
          user_id: user.id,
          title,
          start_weight: parseFloat(startWeight),
          target_weight: parseFloat(targetWeight),
          target_date: targetDate,
          deposit: parseInt(form.deposit || '0'),
          invite_code: generateInviteCode(),
        })
        .select('id')
        .single();

      if (challengeErr) throw challengeErr;

      // 사진 업로드
      let photoUrl: string | null = null;
      if (photoFile) {
        const today = new Date().toISOString().split('T')[0];
        const path = `${user.id}/${challenge.id}/${today}`;
        const { error: uploadErr } = await supabase.storage
          .from('diet-photos')
          .upload(path, photoFile, { upsert: true });
        if (!uploadErr) photoUrl = path;
      }

      // 시작 체중 첫 번째 일일 기록
      await supabase.from('diet_daily_logs').insert({
        challenge_id: challenge.id,
        weight: parseFloat(startWeight),
        photo_url: photoUrl,
      });

      router.push('/diet/my');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '오류가 발생했습니다.';
      setError(
        msg.includes('unique') || msg.includes('duplicate')
          ? '이미 진행 중인 다이어트가 있습니다.'
          : msg
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="flex flex-1 flex-col min-h-0"
      style={{ backgroundColor: '#F4E6C6' }}
    >
      <header
        className="flex items-center gap-3 px-5 py-4 shrink-0"
        style={{ backgroundColor: '#2C1A0E' }}
      >
        <button
          onClick={() => router.back()}
          className="text-xl w-8"
          style={{ color: '#F4E6C6' }}
          aria-label="뒤로가기"
        >
          ←
        </button>
        <h1 className="text-lg font-bold" style={{ color: '#F2C14E' }}>
          다이어트 시작하기
        </h1>
      </header>

      <ScrollableArea>
      <div className="px-5 py-6 flex flex-col gap-5">

        <Field label="적에게 알릴 다이어트 이름">
          <input
            type="text"
            placeholder="예) 여름 -10kg 작전"
            value={form.title}
            onChange={e => setField('title', e.target.value)}
            className="w-full h-12 px-4 rounded-xl text-sm outline-none"
            style={{ backgroundColor: '#FAFAF7', color: '#2C1A0E' }}
          />
        </Field>

        <Field label="현재 체중">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                placeholder="0.0"
                value={form.startWeight}
                onChange={e => setField('startWeight', e.target.value)}
                className="w-full h-12 px-4 pr-10 rounded-xl text-sm outline-none"
                style={{ backgroundColor: '#FAFAF7', color: '#2C1A0E' }}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                style={{ color: '#7B4A2D' }}
              >
                kg
              </span>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 h-12 px-4 rounded-xl text-sm font-semibold shrink-0 transition-opacity hover:opacity-85 active:opacity-70"
              style={{ backgroundColor: '#C47B3A', color: '#FAFAF7' }}
            >
              📷 사진 업로드
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
          {photoPreview && (
            <div className="mt-2 relative w-24 h-24 rounded-xl overflow-hidden">
              <Image src={photoPreview} alt="현재 체중 사진" fill className="object-cover" />
              <button
                type="button"
                onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          )}
        </Field>

        <Field label="목표 체중">
          <div className="relative">
            <input
              type="number"
              placeholder="0.0"
              value={form.targetWeight}
              onChange={e => setField('targetWeight', e.target.value)}
              className="w-full h-12 px-4 pr-10 rounded-xl text-sm outline-none"
              style={{ backgroundColor: '#FAFAF7', color: '#2C1A0E' }}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium"
              style={{ color: '#7B4A2D' }}
            >
              kg
            </span>
          </div>
        </Field>

        <Field label="목표 기한">
          <input
            type="date"
            value={form.targetDate}
            onChange={e => setField('targetDate', e.target.value)}
            className="w-full h-12 px-4 rounded-xl text-sm outline-none"
            style={{ backgroundColor: '#FAFAF7', color: '#2C1A0E' }}
          />
        </Field>

        <Field label="예치금">
          <div className="relative">
            <input
              type="number"
              placeholder="0"
              value={form.deposit}
              onChange={e => setField('deposit', e.target.value)}
              className="w-full h-12 px-4 pr-10 rounded-xl text-sm outline-none"
              style={{ backgroundColor: '#FAFAF7', color: '#2C1A0E' }}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium"
              style={{ color: '#7B4A2D' }}
            >
              원
            </span>
          </div>
        </Field>

        {error && (
          <p className="text-sm font-medium text-center" style={{ color: '#C47B3A' }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-14 rounded-xl font-bold text-base mt-2 transition-opacity hover:opacity-85 active:opacity-70 disabled:opacity-50"
          style={{ backgroundColor: '#2C1A0E', color: '#F2C14E' }}
        >
          {submitting ? '저장 중...' : '다이어트 시작하기'}
        </button>
      </div>
      </ScrollableArea>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold" style={{ color: '#7B4A2D' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
