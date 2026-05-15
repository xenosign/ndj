import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MyDietPageClient from '@/components/diet/MyDietPageClient';

export default async function MyDietPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <MyDietPageClient userId={user.id} />;
}
