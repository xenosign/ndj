'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { getKSTDateString } from '@/utils/date';

interface Props {
  challengeId: string;
  userId: string;
  todayWeight: number | null;
  todayPhotoPath: string | null;
}

export default function DailyLogButton({ challengeId, userId, todayWeight, todayPhotoPath }: Props) {
  const router = useRouter();
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [uploadWeight, setUploadWeight] = useState(todayWeight !== null ? String(todayWeight) : '');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [photoViewOpen, setPhotoViewOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [currentPhotoPath, setCurrentPhotoPath] = useState<string | null>(todayPhotoPath);

  function handlePhotoUploadOpen() {
    setUploadWeight(todayWeight !== null ? String(todayWeight) : '');
    setUploadFile(null);
    setUploadPreview(null);
    setUploadError(null);
    setPhotoUploadOpen(true);
  }

  function handleUploadFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  }

  async function handlePhotoUploadSubmit() {
    if (!uploadFile) { setUploadError('사진을 선택해주세요.'); return; }
    if (todayWeight === null && !uploadWeight) { setUploadError('체중을 입력해주세요.'); return; }
    setUploading(true);
    setUploadError(null);
    try {
      const supabase = createClient();
      const today = getKSTDateString();
      const path = `${userId}/${challengeId}/${today}`;
      const { error: uploadErr } = await supabase.storage
        .from('diet-photos')
        .upload(path, uploadFile, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { error: logErr } = await supabase.from('diet_daily_logs').upsert(
        { challenge_id: challengeId, logged_date: today, weight: todayWeight !== null ? todayWeight : parseFloat(uploadWeight), photo_url: path },
        { onConflict: 'challenge_id,logged_date' }
      );
      if (logErr) throw logErr;
      setCurrentPhotoPath(path);
      setPhotoUploadOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setUploading(false);
    }
  }

  async function handleViewPhoto() {
    if (!currentPhotoPath) return;
    const supabase = createClient();
    const { data } = await supabase.storage.from('diet-photos').createSignedUrl(currentPhotoPath, 3600);
    if (data?.signedUrl) { setSignedUrl(data.signedUrl); setPhotoViewOpen(true); }
  }

  return (
    <>
      <button
        onClick={currentPhotoPath ? handleViewPhoto : handlePhotoUploadOpen}
        className="w-full h-14 rounded-2xl font-bold text-sm transition-opacity active:opacity-80"
        style={{
          backgroundColor: currentPhotoPath ? '#EDE0FF' : '#7B4DBE',
          color: currentPhotoPath ? '#7B4DBE' : '#F8F4FF',
        }}
      >
        {currentPhotoPath ? '📷 오늘 체중 사진 보기' : '📷 오늘 체중 기록하기'}
      </button>

      {/* 업로드 팝업 */}
      {photoUploadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setPhotoUploadOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl px-6 pt-5 pb-10 flex flex-col gap-5"
            style={{ backgroundColor: '#F8F4FF' }}
            onClick={(e) => e.stopPropagation()}

          >
            <div onClick={() => setPhotoUploadOpen(false)} className="w-10 h-1 rounded-full mx-auto cursor-pointer" style={{ backgroundColor: '#D4C0F0' }} />
            <h2 className="text-base font-bold" style={{ color: '#1A0A3D' }}>오늘 체중 기록</h2>

            {todayWeight === null && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold" style={{ color: '#A67FD4' }}>오늘 체중</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={uploadWeight}
                    onChange={(e) => setUploadWeight(e.target.value)}
                    className="w-full h-12 px-4 pr-10 rounded-xl text-sm outline-none border"
                    style={{ backgroundColor: '#F8F4FF', color: '#1A0A3D', borderColor: '#D4C0F0' }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: '#A67FD4' }}>kg</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => photoFileInputRef.current?.click()}
                className="h-11 px-4 rounded-xl text-sm font-semibold transition-opacity active:opacity-70"
                style={{ backgroundColor: '#EDE0FF', color: '#4A2B8A' }}
              >
                📷 사진 선택
              </button>
              {uploadPreview && (
                <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '1' }}>
                  <Image src={uploadPreview} alt="체중 사진" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => { setUploadPreview(null); setUploadFile(null); }}
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white text-xs"
                  >✕</button>
                </div>
              )}
              <input ref={photoFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadFileChange} />
            </div>

            {uploadError && <p className="text-xs font-medium" style={{ color: '#F44' }}>{uploadError}</p>}

            <button
              onClick={handlePhotoUploadSubmit}
              disabled={uploading}
              className="w-full h-13 rounded-xl font-bold text-sm transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#7B4DBE', color: '#F8F4FF' }}
            >
              {uploading ? '업로드 중...' : '기록 저장'}
            </button>
          </div>
        </div>
      )}

      {/* 사진 보기 팝업 */}
      {photoViewOpen && signedUrl && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setPhotoViewOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl flex flex-col"
            style={{ backgroundColor: '#F8F4FF', maxHeight: '85dvh' }}
            onClick={(e) => e.stopPropagation()}

          >
            <div className="px-6 pt-5 pb-3 shrink-0">
              <div onClick={() => setPhotoViewOpen(false)} className="w-10 h-1 rounded-full mx-auto mb-4 cursor-pointer" style={{ backgroundColor: '#D4C0F0' }} />
              <h2 className="text-base font-bold" style={{ color: '#1A0A3D' }}>오늘 체중 사진</h2>
            </div>
            <div className="overflow-y-auto px-6">
              <div className="w-full rounded-2xl overflow-hidden">
                <img src={signedUrl} alt="오늘 체중 사진" className="w-full h-auto" />
              </div>
            </div>
            <div className="px-6 pt-4 pb-10 shrink-0">
              <button
                onClick={() => setPhotoViewOpen(false)}
                className="w-full h-12 rounded-xl font-bold text-sm"
                style={{ backgroundColor: '#F8F4FF', color: '#1A0A3D' }}
              >닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
