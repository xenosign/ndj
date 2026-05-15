import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EnemyDetailPageClient from '@/components/diet/EnemyDetailPageClient';

export default async function EnemyDietDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <EnemyDetailPageClient userId={user.id} challengeId={id} />;
}
