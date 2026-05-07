export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <button className="flex items-center justify-center w-full max-w-sm h-14 rounded-xl font-semibold text-base bg-black text-white transition-opacity hover:opacity-80 active:opacity-70">
        내 다이어트 시작하기
      </button>
      <button className="flex items-center justify-center w-full max-w-sm h-14 rounded-xl font-semibold text-base border-2 border-black text-black transition-colors hover:bg-black hover:text-white active:opacity-70">
        남의 다이어트 참여하기
      </button>
    </main>
  );
}
