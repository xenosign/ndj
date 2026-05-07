'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface Props {
  challengeId: string;
  userId: string;
  todayWeight: number | null;
}

export default function DailyLogButton({
  challengeId,
  userId,
  todayWeight,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState(
    todayWeight !== null ? String(todayWeight) : '',
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    setWeight(todayWeight !== null ? String(todayWeight) : '');
    setPhotoFile(null);
    setPhotoPreview(null);
    setError(null);
    setOpen(true);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!weight) {
      setError('체중을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];

      let photoUrl: string | undefined;
      if (photoFile) {
        const path = `${userId}/${challengeId}/${today}`;
        const { error: uploadErr } = await supabase.storage
          .from('diet-photos')
          .upload(path, photoFile, { upsert: true });
        if (!uploadErr) photoUrl = path;
      }

      const { error: logErr } = await supabase.from('diet_daily_logs').upsert(
        {
          challenge_id: challengeId,
          logged_date: today,
          weight: parseFloat(weight),
          ...(photoUrl !== undefined ? { photo_url: photoUrl } : {}),
        },
        { onConflict: 'challenge_id,logged_date' },
      );

      if (logErr) throw logErr;

      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* 트리거 버튼 */}
      <button
        onClick={handleOpen}
        className="px-5 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-85 active:opacity-70"
        style={{
          backgroundColor: todayWeight !== null ? '#3D2510' : '#C47B3A',
          color: todayWeight !== null ? '#E8D5B0' : '#FAFAF7',
        }}
      >
        오늘 몸무게 등록
      </button>

      {/* 하단 팝업 */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl px-6 pt-5 pb-10 flex flex-col gap-5"
            style={{ backgroundColor: '#3D2510' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 핸들 */}
            <div
              className="w-10 h-1 rounded-full mx-auto"
              style={{ backgroundColor: '#7B4A2D' }}
            />

            <h2 className="text-base font-bold" style={{ color: '#F2C14E' }}>
              오늘 체중 기록
            </h2>

            {/* 체중 입력 */}
            <div className="flex flex-col gap-2">
              <label
                className="text-xs font-semibold"
                style={{ color: '#E8D5B0' }}
              >
                오늘 체중
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full h-12 px-4 pr-10 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: '#2C1A0E', color: '#FAFAF7' }}
                  autoFocus
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                  style={{ color: '#7B4A2D' }}
                >
                  kg
                </span>
              </div>
            </div>

            {/* 사진 업로드 */}
            <div className="flex flex-col gap-2">
              <label
                className="text-xs font-semibold"
                style={{ color: '#E8D5B0' }}
              >
                체중계 사진 (선택)
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-11 px-4 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85 active:opacity-70"
                  style={{ backgroundColor: '#7B4A2D', color: '#F4E6C6' }}
                >
                  📷 사진 선택
                </button>
                {photoPreview && (
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0">
                    <Image
                      src={photoPreview}
                      alt="체중 사진"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setPhotoFile(null);
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {error && (
              <p className="text-xs font-medium" style={{ color: '#F5A58A' }}>
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-13 rounded-xl font-bold text-sm transition-opacity hover:opacity-85 active:opacity-70 disabled:opacity-50"
              style={{ backgroundColor: '#F2C14E', color: '#2C1A0E' }}
            >
              {submitting ? '저장 중...' : '기록 저장'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
