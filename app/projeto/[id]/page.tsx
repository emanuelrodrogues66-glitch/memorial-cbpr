import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProjetoForm from './ProjetoForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProjetoPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: projeto } = await supabase
    .from('memorial_projetos')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!projeto) notFound();

  const { data: profile } = await supabase
    .from('memorial_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-muted hover:text-ink">← Projetos</Link>
            <div className="font-semibold text-ink">{projeto.nome_obra}</div>
          </div>
          <Link href={`/projeto/${projeto.id}/gerar`} className="btn-primary">
            Gerar documentos
          </Link>
        </div>
      </header>
      <ProjetoForm projeto={projeto} profile={profile} />
    </main>
  );
}
