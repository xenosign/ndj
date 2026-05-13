'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useBackClose } from '@/hooks/useBackClose';

interface Mission {
  id: string;
  content: string;
  photo_url: string | null;
}

interface Props {
  challengeId: string;
  userId: string;
  todayMission: Mission | null;
  tomorrowMission: { id: string; content: string } | null;
  todayPhotoSignedUrl: string | null;
  verificationCount: number;
  today: string;
  tomorrow: string;
}

export default function MissionCard({
  challengeId,
  userId,
  todayMission,
  tomorrowMission,
  todayPhotoSignedUrl,
  verificationCount,
  today,
  tomorrow,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [photoViewOpen, setPhotoViewOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentSignedUrl, setCurrentSignedUrl] = useState<string | null>(todayPhotoSignedUrl);
  const [hasPhoto, setHasPhoto] = useState(!!todayMission?.photo_url);

  const [todayPostOpen, setTodayPostOpen] = useState(false);
  const [todayMissionContent, setTodayMissionContent] = useState('');
  const [savingToday, setSavingToday] = useState(false);
  const [saveTodayError, setSaveTodayError] = useState<string | null>(null);

  const [tomorrowPostOpen, setTomorrowPostOpen] = useState(false);
  const [missionContent, setMissionContent] = useState(tomorrowMission?.content ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useBackClose(photoUploadOpen, () => setPhotoUploadOpen(false));
  useBackClose(photoViewOpen, () => setPhotoViewOpen(false));
  useBackClose(todayPostOpen, () => setTodayPostOpen(false));
  useBackClose(tomorrowPostOpen, () => setTomorrowPostOpen(false));

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  }

  async function handlePhotoUpload() {
    if (!uploadFile) { setUploadError('사진을 선택해주세요.'); return; }
    if (!todayMission) return;
    setUploading(true);
    setUploadError(null);
    try {
      const supabase = createClient();
      const path = `${userId}/${challengeId}/missions/${today}`;
      const { error: uploadErr } = await supabase.storage
        .from('diet-photos')
        .upload(path, uploadFile, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { error: updateErr } = await supabase
        .from('diet_missions')
        .update({ photo_url: path })
        .eq('id', todayMission.id);
      if (updateErr) throw updateErr;
      setHasPhoto(true);
      setPhotoUploadOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setUploading(false);
    }
  }

  async function handleViewPhoto() {
    if (currentSignedUrl) { setPhotoViewOpen(true); return; }
    if (!todayMission?.photo_url) return;
    const supabase = createClient();
    const { data } = await supabase.storage
      .from('diet-photos')
      .createSignedUrl(todayMission.photo_url, 3600);
    if (data?.signedUrl) { setCurrentSignedUrl(data.signedUrl); setPhotoViewOpen(true); }
  }

  async function handleSaveTodayMission() {
    if (!todayMissionContent.trim()) { setSaveTodayError('미션 내용을 입력해주세요.'); return; }
    setSavingToday(true);
    setSaveTodayError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('diet_missions')
        .insert({ challenge_id: challengeId, mission_date: today, content: todayMissionContent.trim() });
      if (error) throw error;
      setTodayPostOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setSaveTodayError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setSavingToday(false);
    }
  }

  async function handleSaveTomorrowMission() {
    if (!missionContent.trim()) { setSaveError('미션 내용을 입력해주세요.'); return; }
    setSaving(true);
    setSaveError(null);
    try {
      const supabase = createClient();
      if (tomorrowMission) {
        const { error } = await supabase
          .from('diet_missions')
          .update({ content: missionContent.trim() })
          .eq('id', tomorrowMission.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('diet_missions')
          .insert({ challenge_id: challengeId, mission_date: tomorrow, content: missionContent.trim() });
        if (error) throw error;
      }
      setTomorrowPostOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setSaving(false);
    }
  }

  return (
    <>
      <div
        className="rounded-2xl px-5 py-5 flex flex-col gap-4"
        style={{ backgroundColor: '#F8F4FF', boxShadow: '0 4px 20px rgba(123,77,190,0.28)' }}
      >
        {todayMission ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed" style={{ color: '#1A0A3D' }}>
              {todayMission.content}
            </p>
            {verificationCount > 0 && (
              <p className="text-xs font-semibold" style={{ color: '#A67FD4' }}>
                📣 {verificationCount}명이 인증 사진을 요청했어요
              </p>
            )}
            <button
              onClick={hasPhoto ? handleViewPhoto : () => setPhotoUploadOpen(true)}
              className="w-full h-11 rounded-xl text-sm font-semibold transition-opacity active:opacity-70"
              style={{
                backgroundColor: hasPhoto ? '#EDE0FF' : '#7B4DBE',
                color: hasPhoto ? '#7B4DBE' : '#F8F4FF',
              }}
            >
              {hasPhoto ? '📷 인증 사진 보기' : '📷 인증 사진 올리기'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-sm text-center" style={{ color: '#A67FD4' }}>오늘 미션이 없어요</p>
            <button
              onClick={() => { setTodayMissionContent(''); setSaveTodayError(null); setTodayPostOpen(true); }}
              className="w-full h-11 rounded-xl text-sm font-semibold transition-opacity active:opacity-70"
              style={{ backgroundColor: '#4A2B8A', color: '#F8F4FF' }}
            >
              ✏️ 오늘 미션 등록
            </button>
          </div>
        )}

        {tomorrowMission && (
          <p className="text-xs px-1 leading-relaxed" style={{ color: '#A67FD4' }}>
            내일: {tomorrowMission.content}
          </p>
        )}
        <button
          onClick={() => {
            setMissionContent(tomorrowMission?.content ?? '');
            setSaveError(null);
            setTomorrowPostOpen(true);
          }}
          className="w-full h-11 rounded-xl text-sm font-semibold transition-opacity active:opacity-70"
          style={{ backgroundColor: '#EDE0FF', color: '#4A2B8A' }}
        >
          {tomorrowMission ? '✏️ 내일 미션 수정' : '✏️ 내일 미션 등록'}
        </button>
      </div>

      {/* 인증 사진 업로드 모달 */}
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
            <h2 className="text-base font-bold" style={{ color: '#1A0A3D' }}>미션 인증 사진</h2>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-11 px-4 rounded-xl text-sm font-semibold transition-opacity active:opacity-70"
                style={{ backgroundColor: '#EDE0FF', color: '#4A2B8A' }}
              >
                📷 사진 선택
              </button>
              {uploadPreview && (
                <div
                  className="relative w-full rounded-2xl overflow-hidden"
                  style={{ aspectRatio: '1' }}
                >
                  <Image src={uploadPreview} alt="인증 사진" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => { setUploadPreview(null); setUploadFile(null); }}
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {uploadError && (
              <p className="text-xs font-medium" style={{ color: '#F44' }}>{uploadError}</p>
            )}
            <button
              onClick={handlePhotoUpload}
              disabled={uploading}
              className="w-full h-12 rounded-xl font-bold text-sm transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#7B4DBE', color: '#F8F4FF' }}
            >
              {uploading ? '업로드 중...' : '인증 사진 저장'}
            </button>
          </div>
        </div>
      )}

      {/* 인증 사진 보기 모달 */}
      {photoViewOpen && currentSignedUrl && (
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
              <h2 className="text-base font-bold" style={{ color: '#1A0A3D' }}>미션 인증 사진</h2>
            </div>
            <div className="overflow-y-auto px-6">
              <div className="w-full rounded-2xl overflow-hidden">
                <img src={currentSignedUrl} alt="미션 인증 사진" className="w-full h-auto" />
              </div>
            </div>
            <div className="px-6 pt-4 pb-10 shrink-0">
              <button
                onClick={() => setPhotoViewOpen(false)}
                className="w-full h-12 rounded-xl font-bold text-sm"
                style={{ backgroundColor: '#F8F4FF', color: '#1A0A3D' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 오늘 미션 등록 모달 */}
      {todayPostOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setTodayPostOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl px-6 pt-5 pb-10 flex flex-col gap-5"
            style={{ backgroundColor: '#F8F4FF' }}
            onClick={(e) => e.stopPropagation()}

          >
            <div onClick={() => setTodayPostOpen(false)} className="w-10 h-1 rounded-full mx-auto cursor-pointer" style={{ backgroundColor: '#D4C0F0' }} />
            <h2 className="text-base font-bold" style={{ color: '#1A0A3D' }}>오늘 미션 등록</h2>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold" style={{ color: '#A67FD4' }}>미션 내용</label>
              <textarea
                value={todayMissionContent}
                onChange={(e) => setTodayMissionContent(e.target.value)}
                placeholder="오늘 수행할 미션을 입력하세요..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none border resize-none"
                style={{ backgroundColor: '#F8F4FF', color: '#1A0A3D', borderColor: '#D4C0F0' }}
              />
            </div>
            {saveTodayError && (
              <p className="text-xs font-medium" style={{ color: '#F44' }}>{saveTodayError}</p>
            )}
            <button
              onClick={handleSaveTodayMission}
              disabled={savingToday}
              className="w-full h-12 rounded-xl font-bold text-sm transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#4A2B8A', color: '#F8F4FF' }}
            >
              {savingToday ? '저장 중...' : '미션 저장'}
            </button>
          </div>
        </div>
      )}

      {/* 내일 미션 등록/수정 모달 */}
      {tomorrowPostOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setTomorrowPostOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl px-6 pt-5 pb-10 flex flex-col gap-5"
            style={{ backgroundColor: '#F8F4FF' }}
            onClick={(e) => e.stopPropagation()}

          >
            <div onClick={() => setTomorrowPostOpen(false)} className="w-10 h-1 rounded-full mx-auto cursor-pointer" style={{ backgroundColor: '#D4C0F0' }} />
            <h2 className="text-base font-bold" style={{ color: '#1A0A3D' }}>
              내일 미션 {tomorrowMission ? '수정' : '등록'}
            </h2>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold" style={{ color: '#A67FD4' }}>미션 내용</label>
              <textarea
                value={missionContent}
                onChange={(e) => setMissionContent(e.target.value)}
                placeholder="내일 수행할 미션을 입력하세요..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none border resize-none"
                style={{ backgroundColor: '#F8F4FF', color: '#1A0A3D', borderColor: '#D4C0F0' }}
              />
            </div>
            {saveError && (
              <p className="text-xs font-medium" style={{ color: '#F44' }}>{saveError}</p>
            )}
            <button
              onClick={handleSaveTomorrowMission}
              disabled={saving}
              className="w-full h-12 rounded-xl font-bold text-sm transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#7B4DBE', color: '#F8F4FF' }}
            >
              {saving ? '저장 중...' : '미션 저장'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
