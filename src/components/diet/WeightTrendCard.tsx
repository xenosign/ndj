'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { getKSTDateString } from '@/utils/date';
import { useBackClose } from '@/hooks/useBackClose';

interface WeightLog {
  logged_date: string;
  weight: number;
}

interface Props {
  challengeId: string;
  userId: string;
  currentWeight: number;
  startWeight: number;
  targetWeight: number;
  todayWeight: number | null;
  todayPhotoPath: string | null;
  recentLogs: WeightLog[];
  progress: number;
}

function WeightLineChart({ logs }: { logs: WeightLog[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [W, setW] = useState(200);
  const H = 64;
  const PAD = 6;

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setW(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const logMap = new Map(logs.map((l) => [l.logged_date, l.weight]));

  const dataSlots = days
    .map((day, i) => ({ i, weight: logMap.get(day) }))
    .filter((d): d is { i: number; weight: number } => d.weight !== undefined);

  const points: { x: number; y: number }[] = [];
  if (dataSlots.length > 0) {
    const weights = dataSlots.map((d) => d.weight);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const range = maxW - minW || 1;
    const slotStep = (W - PAD * 2) / 6; // 하루 = 한 칸
    dataSlots.forEach((d) => {
      points.push({
        x: PAD + d.i * slotStep,
        y: PAD + (1 - (d.weight - minW) / range) * (H - PAD * 2),
      });
    });
  }

  const polyline = points
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath =
    points.length > 1
      ? `M${points[0].x},${H} ` +
        points.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
        ` L${points[points.length - 1].x},${H} Z`
      : '';

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
{areaPath && <path d={areaPath} fill="url(#wGrad)" />}
      {points.length > 1 && (
        <polyline
          points={polyline}
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="white" />
      ))}
      {points.length === 0 && (
        <line
          x1={PAD}
          y1={H / 2}
          x2={W - PAD}
          y2={H / 2}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      )}
    </svg>
  );
}

export default function WeightTrendCard({
  challengeId,
  userId,
  currentWeight,
  startWeight,
  targetWeight,
  todayWeight,
  todayPhotoPath,
  recentLogs,
  progress,
}: Props) {
  const router = useRouter();
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadWeight, setUploadWeight] = useState(
    todayWeight !== null ? String(todayWeight) : '',
  );
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [photoViewOpen, setPhotoViewOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useBackClose(uploadOpen, () => setUploadOpen(false));
  useBackClose(photoViewOpen, () => setPhotoViewOpen(false));
  const [currentPhotoPath, setCurrentPhotoPath] = useState<string | null>(
    todayPhotoPath,
  );

  const prevLog = recentLogs.length > 1 ? recentLogs[recentLogs.length - 2] : null;
  const weightChange = prevLog ? +(currentWeight - prevLog.weight).toFixed(1) : null;
  const daysAgo = prevLog
    ? Math.round((Date.now() - new Date(prevLog.logged_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const diff = +(currentWeight - targetWeight).toFixed(1);

  function handleUploadOpen() {
    setUploadWeight(todayWeight !== null ? String(todayWeight) : '');
    setUploadFile(null);
    setUploadPreview(null);
    setUploadError(null);
    setUploadOpen(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!uploadFile) {
      setUploadError('사진을 선택해주세요.');
      return;
    }
    if (todayWeight === null && !uploadWeight) {
      setUploadError('체중을 입력해주세요.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const supabase = createClient();
      const today = getKSTDateString();
      const path = `${userId}/${challengeId}/${today}`;
      const { error: upErr } = await supabase.storage
        .from('diet-photos')
        .upload(path, uploadFile, { upsert: true });
      if (upErr) throw upErr;
      const { error: logErr } = await supabase.from('diet_daily_logs').upsert(
        {
          challenge_id: challengeId,
          logged_date: today,
          weight: todayWeight !== null ? todayWeight : parseFloat(uploadWeight),
          photo_url: path,
        },
        { onConflict: 'challenge_id,logged_date' },
      );
      if (logErr) throw logErr;
      setCurrentPhotoPath(path);
      setUploadOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error ? err.message : '오류가 발생했습니다.',
      );
      setUploading(false);
    }
  }

  async function handleViewPhoto() {
    if (!currentPhotoPath) return;
    const supabase = createClient();
    const { data } = await supabase.storage
      .from('diet-photos')
      .createSignedUrl(currentPhotoPath, 3600);
    if (data?.signedUrl) {
      setSignedUrl(data.signedUrl);
      setPhotoViewOpen(true);
    }
  }

  return (
    <>
      <div
        className="rounded-2xl px-5 py-5 flex flex-col gap-4"
        style={{
          backgroundColor: '#7B4DBE',
          boxShadow: '0 4px 24px rgba(26,10,61,0.35)',
        }}
      >
        {/* 두 컬럼 레이아웃 */}
        <div className="flex gap-3">
          {/* 왼쪽 컬럼: 45% 고정 */}
          <div
            className="flex flex-col gap-3"
            style={{ width: '40%', flexShrink: 0 }}
          >
            <p
              className="text-xs font-semibold"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              현재 내 몸무게
            </p>
            <div className="flex flex-col gap-1">
              <p
                className="font-extrabold leading-none"
                style={{ color: '#F8F4FF', fontSize: '44px' }}
              >
                {currentWeight}
                <span
                  className="text-lg font-semibold ml-1"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  kg
                </span>
              </p>
              {weightChange !== null && daysAgo !== null && (
                <p className="font-bold" style={{ fontSize: '14px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {daysAgo}일 전보다{' '}
                  </span>
                  <span
                    style={{
                      fontSize: '16px',
                      color: weightChange <= 0 ? '#A8E6A3' : '#FFAB9F',
                    }}
                  >
                    {weightChange > 0 ? `+${weightChange}` : weightChange} kg
                  </span>
                </p>
              )}
            </div>
            <button
              onClick={currentPhotoPath ? handleViewPhoto : handleUploadOpen}
              className="w-full text-xs font-bold px-3 py-2 rounded-xl transition-opacity active:opacity-75"
              style={{ backgroundColor: '#4A2B8A', color: '#F8F4FF' }}
            >
              {currentPhotoPath ? '📷 사진 보기' : '📷 기록 업로드'}
            </button>
          </div>

          {/* 오른쪽 컬럼: 나머지 공간 */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <p
              className="text-xs font-semibold text-right"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              최근 7일
            </p>
            <div className="flex-1 min-w-0 overflow-hidden">
              <WeightLineChart logs={recentLogs} />
            </div>
            <div className="flex flex-col gap-1.5">
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, backgroundColor: '#F8F4FF' }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span
                  className="text-xs"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  달성률
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: '#F8F4FF' }}
                >
                  {progress}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 시작 / 목표 레이블 + 목표까지 */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between">
            <span className="text-xs" style={{ color: '#F8F4FF' }}>
              시작 {startWeight}kg
            </span>
            <span className="text-xs" style={{ color: '#F8F4FF' }}>
              목표 {targetWeight}kg
            </span>
          </div>
          <div
            className="flex items-center justify-between rounded-xl px-4 py-2.5"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            <p
              className="text-xs font-medium"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              목표까지
            </p>
            <p className="text-sm font-bold">
              {diff > 0 ? (
                <>
                  <span style={{ color: '#1A0A3D', fontSize: '20px' }}>
                    {diff}kg
                  </span>{' '}
                  <span style={{ color: '#F8F4FF' }}>&nbsp; 더 감량 필요</span>
                </>
              ) : (
                <span style={{ color: '#A8E6A3' }}>
                  {Math.abs(diff)}kg 초과달성 ✓
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 업로드 모달 */}
      {uploadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setUploadOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl px-6 pt-5 pb-10 flex flex-col gap-5"
            style={{ backgroundColor: '#F8F4FF' }}
            onClick={(e) => e.stopPropagation()}

          >
            <div
              onClick={() => setUploadOpen(false)}
              className="w-10 h-1 rounded-full mx-auto cursor-pointer"
              style={{ backgroundColor: '#D4C0F0' }}
            />
            <h2 className="text-base font-bold" style={{ color: '#1A0A3D' }}>
              오늘 체중 기록
            </h2>

            {todayWeight === null && (
              <div className="flex flex-col gap-2">
                <label
                  className="text-xs font-semibold"
                  style={{ color: '#A67FD4' }}
                >
                  오늘 체중
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={uploadWeight}
                    onChange={(e) => setUploadWeight(e.target.value)}
                    className="w-full h-12 px-4 pr-10 rounded-xl text-sm outline-none border"
                    style={{
                      backgroundColor: '#F8F4FF',
                      color: '#1A0A3D',
                      borderColor: '#D4C0F0',
                    }}
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                    style={{ color: '#A67FD4' }}
                  >
                    kg
                  </span>
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
                <div
                  className="relative w-full rounded-2xl overflow-hidden"
                  style={{ aspectRatio: '1' }}
                >
                  <Image
                    src={uploadPreview}
                    alt="체중 사진"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUploadPreview(null);
                      setUploadFile(null);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white text-xs"
                    aria-label="사진 삭제"
                  >
                    ✕
                  </button>
                </div>
              )}
              <input
                ref={photoFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {uploadError && (
              <p className="text-xs font-medium" style={{ color: '#F44' }}>
                {uploadError}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="w-full h-12 rounded-xl font-bold text-sm transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#7B4DBE', color: '#F8F4FF' }}
            >
              {uploading ? '업로드 중...' : '기록 저장'}
            </button>
          </div>
        </div>
      )}

      {/* 사진 보기 모달 */}
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
              <div
                onClick={() => setPhotoViewOpen(false)}
                className="w-10 h-1 rounded-full mx-auto mb-4 cursor-pointer"
                style={{ backgroundColor: '#D4C0F0' }}
              />
              <h2 className="text-base font-bold" style={{ color: '#1A0A3D' }}>
                오늘 체중 사진
              </h2>
            </div>
            <div className="overflow-y-auto px-6">
              <div className="w-full rounded-2xl overflow-hidden">
                <img
                  src={signedUrl}
                  alt="오늘 체중 사진"
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div className="px-6 pt-4 pb-10 shrink-0">
              <button
                onClick={() => setPhotoViewOpen(false)}
                className="w-full h-12 rounded-xl font-bold text-sm"
                style={{ backgroundColor: '#EDE0FF', color: '#4A2B8A' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
