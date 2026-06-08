import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PerfilForm from './PerfilForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Perfil() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase
    .from('memorial_profiles').select('*').eq('id', user.id).maybeSingle();

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-white">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-muted hover:text-ink">← Projetos</Link>
          <div className="font-semibold text-ink">Perfil</div>
        </div>
      </header>
      <section className="max-w-3xl mx-auto px-6 py-10">
        <PerfilForm profile={profile ?? { id: user.id, email: user.email }} />
      </section>
    </main>
  );
}
