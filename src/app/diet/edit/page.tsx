'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function DietEditPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    targetWeight: '',
    targetDate: '',
    deposit: '',
  });

  function setField(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: challenge } = await supabase
        .from('diet_challenges')
        .select('id, title, target_weight, target_date, deposit')
        .eq('user_id', user.id)
        .single();

      if (!challenge) { router.push('/home'); return; }

      setChallengeId(challenge.id);
      setForm({
        title: challenge.title,
        targetWeight: String(challenge.target_weight),
        targetDate: challenge.target_date,
        deposit: String(challenge.deposit ?? 0),
      });
      setLoading(false);
    }
    load();
  }, [router]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!form.title || !form.targetWeight || !form.targetDate) {
      setError('필수 항목을 입력해주세요.');
      return;
    }
    if (!challengeId) return;

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { error: updateErr } = await supabase
        .from('diet_challenges')
        .update({
          title: form.title,
          target_weight: parseFloat(form.targetWeight),
          target_date: form.targetDate,
          deposit: parseInt(form.deposit || '0'),
        })
        .eq('id', challengeId);

      if (updateErr) throw updateErr;

      // 오늘 체중 사진 업데이트 (선택)
      if (photoFile) {
        const today = new Date().toISOString().split('T')[0];
        const path = `${user.id}/${challengeId}/${today}`;
        await supabase.storage.from('diet-photos').upload(path, photoFile, { upsert: true });
      }

      router.push('/diet/my');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center" style={{ backgroundColor: '#2C1A0E' }}>
        <p className="text-sm" style={{ color: '#E8D5B0' }}>불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col min-h-0" style={{ backgroundColor: '#F4E6C6' }}>
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
          다이어트 수정
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-5">

        <Field label="다이어트 이름">
          <input
            type="text"
            placeholder="예) 여름 -10kg 작전"
            value={form.title}
            onChange={e => setField('title', e.target.value)}
            className="w-full h-12 px-4 rounded-xl text-sm outline-none"
            style={{ backgroundColor: '#FAFAF7', color: '#2C1A0E' }}
          />
        </Field>

        <Field label="오늘 체중 사진 (선택)">
          <div className="flex gap-3">
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
              <Image src={photoPreview} alt="체중 사진" fill className="object-cover" />
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
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: '#7B4A2D' }}>
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
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: '#7B4A2D' }}>
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
          {submitting ? '저장 중...' : '수정 완료'}
        </button>
      </div>
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
