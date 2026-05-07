import TopHeader from '@/components/layout/TopHeader';

export default function MyDietPage() {
  const dietTitle = '여름 -10kg 작전';
  const daysLeft = 47;
  const currentWeight = 82.5;
  const targetWeight = 72.0;
  const diff = +(targetWeight - currentWeight).toFixed(1);
  const boomUp = 128;
  const boomDown = 34;

  const LABEL_COLOR = '#E8D5B0';

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: '#2C1A0E' }}>
      <TopHeader title="내 다이어트" backHref="/home" />

      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">

        {/* 다이어트 제목 + D-X일 */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: '#F2C14E' }}>
            {dietTitle}
          </h2>
          <span
            className="text-sm font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: '#7B4A2D', color: '#F2C14E' }}
          >
            D - {daysLeft}일
          </span>
        </div>

        {/* 목표까지 남은 체중 */}
        <div className="flex flex-col items-center justify-center flex-1 gap-2">
          <p className="text-sm font-medium" style={{ color: LABEL_COLOR }}>
            목표 체중까지
          </p>
          <p
            className="font-extrabold leading-none"
            style={{ color: '#F2C14E', fontSize: '72px' }}
          >
            {diff > 0 ? `+${diff}` : diff}kg
          </p>
        </div>

        {/* 현재 체중 / 목표 체중 */}
        <div className="flex rounded-2xl overflow-hidden" style={{ backgroundColor: '#3D2510' }}>
          <div className="flex-1 flex flex-col items-center py-4 gap-1">
            <span className="text-xs font-medium" style={{ color: LABEL_COLOR }}>현재 체중</span>
            <span className="text-2xl font-bold" style={{ color: '#FAFAF7' }}>
              {currentWeight}
              <span className="text-sm font-normal ml-1" style={{ color: '#7B4A2D' }}>kg</span>
            </span>
          </div>
          <div style={{ width: 1, backgroundColor: '#7B4A2D', margin: '12px 0' }} />
          <div className="flex-1 flex flex-col items-center py-4 gap-1">
            <span className="text-xs font-medium" style={{ color: LABEL_COLOR }}>목표 체중</span>
            <span className="text-2xl font-bold" style={{ color: '#F2C14E' }}>
              {targetWeight}
              <span className="text-sm font-normal ml-1" style={{ color: '#7B4A2D' }}>kg</span>
            </span>
          </div>
        </div>

        {/* 적들의 댓글 보기 */}
        <button
          className="w-full rounded-2xl font-semibold text-sm py-4 transition-opacity hover:opacity-85 active:opacity-70"
          style={{ backgroundColor: '#F5A58A', color: '#2C1A0E' }}
        >
          🔥 적들의 댓글 보기
        </button>

        {/* 붐업 / 붐다운 */}
        <div className="flex rounded-2xl overflow-hidden" style={{ backgroundColor: '#3D2510' }}>
          <div className="flex-1 flex flex-col items-center py-4 gap-1">
            <span className="text-xs font-medium" style={{ color: LABEL_COLOR }}>붐업 👍</span>
            <span className="text-2xl font-bold" style={{ color: '#F2C14E' }}>{boomUp.toLocaleString()}</span>
          </div>
          <div style={{ width: 1, backgroundColor: '#7B4A2D', margin: '12px 0' }} />
          <div className="flex-1 flex flex-col items-center py-4 gap-1">
            <span className="text-xs font-medium" style={{ color: LABEL_COLOR }}>붐다운 👎</span>
            <span className="text-2xl font-bold" style={{ color: '#F5A58A' }}>{boomDown.toLocaleString()}</span>
          </div>
        </div>

        {/* 적들 초대하기 */}
        <button
          className="w-full rounded-2xl font-semibold text-sm py-4 transition-opacity hover:opacity-85 active:opacity-70"
          style={{ backgroundColor: '#F2C14E', color: '#2C1A0E' }}
        >
          ⚔️ 적들 초대하기
        </button>
      </div>
    </main>
  );
}
