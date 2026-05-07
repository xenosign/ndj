'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function DietStartPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
  }

  return (
    <main
      className="flex flex-1 flex-col min-h-0"
      style={{ backgroundColor: '#F4E6C6' }}
    >
      {/* 헤더 */}
      <header
        className="flex items-center gap-3 px-5 py-4"
        style={{ backgroundColor: '#2C1A0E' }}
      >
        <button
          onClick={() => router.back()}
          className="text-xl"
          style={{ color: '#F4E6C6' }}
          aria-label="뒤로가기"
        >
          ←
        </button>
        <h1 className="text-lg font-bold" style={{ color: '#F2C14E' }}>
          다이어트 시작하기
        </h1>
      </header>

      {/* 폼 */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-5">

        {/* 다이어트 이름 */}
        <Field label="적에게 알릴 다이어트 이름">
          <input
            type="text"
            placeholder="예) 여름 -10kg 작전"
            className="w-full h-12 px-4 rounded-xl text-sm outline-none"
            style={{ backgroundColor: '#FAFAF7', color: '#2C1A0E' }}
          />
        </Field>

        {/* 현재 체중 + 사진 */}
        <Field label="현재 체중">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                placeholder="0.0"
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
              <Image
                src={photoPreview}
                alt="현재 체중 사진"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => setPhotoPreview(null)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          )}
        </Field>

        {/* 목표 체중 */}
        <Field label="목표 체중">
          <div className="relative">
            <input
              type="number"
              placeholder="0.0"
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

        {/* 목표 기한 */}
        <Field label="목표 기한">
          <input
            type="date"
            className="w-full h-12 px-4 rounded-xl text-sm outline-none"
            style={{ backgroundColor: '#FAFAF7', color: '#2C1A0E' }}
          />
        </Field>

        {/* 예치금 */}
        <Field label="예치금">
          <div className="relative">
            <input
              type="number"
              placeholder="0"
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

        {/* 시작 버튼 */}
        <button
          type="button"
          className="w-full h-14 rounded-xl font-bold text-base mt-2 transition-opacity hover:opacity-85 active:opacity-70"
          style={{ backgroundColor: '#2C1A0E', color: '#F2C14E' }}
        >
          다이어트 시작하기
        </button>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold" style={{ color: '#7B4A2D' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
