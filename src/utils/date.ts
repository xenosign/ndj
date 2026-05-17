/**
 * KST(UTC+9) 기준 날짜 문자열(YYYY-MM-DD) 반환
 * offsetDays: 양수면 미래, 음수면 과거
 */
export function getKSTDateString(offsetDays = 0): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000 + offsetDays * 24 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}
