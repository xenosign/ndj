import TopHeader from '@/components/layout/TopHeader';

export default function Loading() {
  return (
    <>
      <TopHeader showBack={false} />
      <main className="flex flex-1 flex-col items-center justify-center" style={{ backgroundColor: '#F8F4FF' }}>
        <div
          className="w-10 h-10 rounded-full border-4 animate-spin"
          style={{ borderColor: '#7B4DBE', borderTopColor: 'transparent' }}
        />
      </main>
    </>
  );
}
