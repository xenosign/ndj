import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      className="flex flex-1 flex-col items-center justify-center gap-6 p-8"
      style={{ backgroundColor: '#1A0A3D' }}
    >
      <p
        className="font-extrabold leading-none"
        style={{ color: '#A67FD4', fontSize: '80px' }}
      >
        404
      </p>
      <p className="text-lg font-semibold" style={{ color: '#D4C0F0' }}>
        페이지를 찾을 수 없어요
      </p>
      <Link
        href="/home"
        className="flex items-center justify-center h-13 px-8 py-4 rounded-xl font-semibold text-sm transition-opacity hover:opacity-85 active:opacity-70"
        style={{ backgroundColor: '#A67FD4', color: '#1A0A3D' }}
      >
        홈으로 돌아가기
      </Link>
    </main>
  );
}
