import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EnemiesPageClient from '@/components/diet/EnemiesPageClient';

export default async function EnemiesDietPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <EnemiesPageClient userId={user.id} />;
}
