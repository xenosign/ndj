'use client';

import { useEffect, useRef, useState } from 'react';
import EnemyPhotoButton from '@/components/diet/EnemyPhotoButton';

interface WeightLog {
  logged_date: string;
  weight: number;
}

interface Props {
  currentWeight: number;
  startWeight: number;
  targetWeight: number;
  recentLogs: WeightLog[];
  progress: number;
  hasPhoto: boolean;
  signedUrl: string | null;
  challengeId: string;
  challengeOwnerId: string;
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
  const orderedWeights: number[] = [];
  days.forEach((day) => {
    const w = logMap.get(day);
    if (w !== undefined) orderedWeights.push(w);
  });

  const points: { x: number; y: number }[] = [];
  if (orderedWeights.length > 0) {
    const minW = Math.min(...orderedWeights);
    const maxW = Math.max(...orderedWeights);
    const range = maxW - minW || 1;
    const step = orderedWeights.length > 1 ? (W - PAD * 2) / (orderedWeights.length - 1) : 0;
    orderedWeights.forEach((w, i) => {
      points.push({ x: PAD + i * step, y: PAD + (1 - (w - minW) / range) * (H - PAD * 2) });
    });
  }

  const polyline = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath =
    points.length > 1
      ? `M${points[0].x},${H} ` +
        points.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
        ` L${points[points.length - 1].x},${H} Z`
      : '';

  return (
    <svg ref={svgRef} width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="wGradEnemy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      {areaPath && <path d={areaPath} fill="url(#wGradEnemy)" />}
      {points.length > 1 && (
        <polyline points={polyline} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="white" />)}
      {points.length === 0 && (
        <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="4 3" />
      )}
    </svg>
  );
}

export default function EnemyWeightTrendCard({
  currentWeight,
  startWeight,
  targetWeight,
  recentLogs,
  progress,
  hasPhoto,
  signedUrl,
  challengeId,
  challengeOwnerId,
}: Props) {
  const prevLog = recentLogs.length > 1 ? recentLogs[recentLogs.length - 2] : null;
  const weightChange = prevLog ? +(currentWeight - prevLog.weight).toFixed(1) : null;
  const daysAgo = prevLog
    ? Math.round((Date.now() - new Date(prevLog.logged_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const diff = +(currentWeight - targetWeight).toFixed(1);

  return (
    <div
      className="rounded-2xl px-5 py-5 flex flex-col gap-4"
      style={{ backgroundColor: '#7B4DBE', boxShadow: '0 4px 24px rgba(26,10,61,0.35)' }}
    >
      <div className="flex gap-3">
        {/* 왼쪽: 체중 */}
        <div className="flex flex-col gap-3" style={{ width: '40%', flexShrink: 0 }}>
          <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>적의 몸무게</p>
          <div className="flex flex-col gap-1">
            <p className="font-extrabold leading-none" style={{ color: '#F8F4FF', fontSize: '44px' }}>
              {currentWeight}
              <span className="text-lg font-semibold ml-1" style={{ color: 'rgba(255,255,255,0.6)' }}>kg</span>
            </p>
            {weightChange !== null && daysAgo !== null ? (
              <p className="font-bold" style={{ fontSize: '14px' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{daysAgo}일 전보다 </span>
                <span style={{ fontSize: '16px', color: weightChange <= 0 ? '#A8E6A3' : '#FFAB9F' }}>
                  {weightChange > 0 ? `+${weightChange}` : weightChange} kg
                </span>
              </p>
            ) : (
              <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>내일 기록 필요</p>
            )}
          </div>
          <EnemyPhotoButton
            hasPhoto={hasPhoto}
            signedUrl={signedUrl}
            challengeId={challengeId}
            challengeOwnerId={challengeOwnerId}
          />
        </div>

        {/* 오른쪽: 그래프 */}
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <p className="text-xs font-semibold text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>최근 7일</p>
          <div className="flex-1 min-w-0 overflow-hidden flex items-center justify-center" style={{ minHeight: 64 }}>
            {recentLogs.length > 1 ? (
              <WeightLineChart logs={recentLogs} />
            ) : (
              <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>아직 그래프를 볼 수 없어요</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: '#F8F4FF' }} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>달성률</span>
              <span className="text-xs font-bold" style={{ color: '#F8F4FF' }}>{progress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 시작 / 목표 / 목표까지 */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between">
          <span className="text-xs" style={{ color: '#F8F4FF' }}>시작 {startWeight}kg</span>
          <span className="text-xs" style={{ color: '#F8F4FF' }}>목표 {targetWeight}kg</span>
        </div>
        <div
          className="flex items-center justify-between rounded-xl px-4 py-2.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>목표까지</p>
          <p className="text-sm font-bold">
            {diff > 0 ? (
              <>
                <span style={{ color: '#1A0A3D', fontSize: '20px' }}>{diff}kg</span>
                <span style={{ color: '#F8F4FF' }}>&nbsp; 더 감량 필요</span>
              </>
            ) : (
              <span style={{ color: '#A8E6A3' }}>{Math.abs(diff)}kg 초과달성 ✓</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
