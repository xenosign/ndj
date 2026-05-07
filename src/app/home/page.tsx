import Image from 'next/image';

export default function HomePage() {
  return (
    <main
      className="flex flex-1 flex-col items-center justify-center gap-4 p-8"
      style={{ backgroundColor: '#F4E6C6' }}
    >
      <Image
        src="/icons/ndj-logo-512.png"
        alt="NDJ 로고"
        width={234}
        height={234}
        className="mb-4 rounded-3xl"
        priority
      />
      <button
        className="flex items-center justify-center w-full max-w-sm h-14 rounded-xl font-semibold text-base transition-opacity hover:opacity-85 active:opacity-70"
        style={{ backgroundColor: '#2C1A0E', color: '#F4E6C6' }}
      >
        내 다이어트 시작하기
      </button>
      <button
        className="flex items-center justify-center w-full max-w-sm h-14 rounded-xl font-semibold text-base transition-opacity hover:opacity-85 active:opacity-70"
        style={{ backgroundColor: '#C47B3A', color: '#FAFAF7' }}
      >
        남의 다이어트 참여하기
      </button>
    </main>
  );
}
