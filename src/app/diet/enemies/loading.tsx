export default function Loading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center" style={{ backgroundColor: '#F8F4FF' }}>
      <div
        className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: '#7B4DBE', borderTopColor: 'transparent' }}
      />
    </main>
  );
}
