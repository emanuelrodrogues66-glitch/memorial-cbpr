import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NovoProjetoButton from './NovoProjetoButton';
import LogoutButton from './LogoutButton';
import DuplicarProjetoButton from './DuplicarProjetoButton';
import ExcluirProjetoButton from './ExcluirProjetoButton';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('memorial_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const { data: projetos } = await supabase
    .from('memorial_projetos')
    .select('id, nome_obra, status, updated_at, created_at')
    .order('updated_at', { ascending: false });

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold text-ink">Memorial CBPR</Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/dashboard" className="text-ink hover:text-primary">Projetos</Link>
              <Link href="/leads" className="text-muted hover:text-ink">Leads</Link>
              {(user.email || '').toLowerCase() === 'emanuelrodrogues66@gmail.com' && (
                <Link href="/admin" className="text-muted hover:text-ink">Administração</Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/perfil" className="text-sm text-muted hover:text-ink">
              {profile?.full_name || user.email}
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink">Meus projetos</h1>
            <p className="text-sm text-muted mt-1">
              Crie um novo memorial ou continue um existente.
            </p>
          </div>
          <NovoProjetoButton />
        </div>

        <div className="mt-8 grid gap-3">
          {(!projetos || projetos.length === 0) && (
            <div className="card text-center py-16">
              <p className="text-muted">Você ainda não tem nenhum projeto.</p>
              <div className="mt-4 inline-block">
                <NovoProjetoButton />
              </div>
            </div>
          )}
          {projetos?.map((p) => (
            <div
              key={p.id}
              className="card flex items-center justify-between hover:border-primary transition"
            >
              <Link href={`/projeto/${p.id}`} className="flex-1 min-w-0">
                <div className="font-semibold text-ink truncate">{p.nome_obra || 'Projeto sem nome'}</div>
                <div className="text-xs text-muted mt-1">
                  Atualizado em {new Date(p.updated_at).toLocaleString('pt-BR')}
                </div>
              </Link>
              <div className="flex items-center gap-3 ml-3">
                <span className="text-xs uppercase tracking-wide font-medium text-primary border border-primary/30 rounded-full px-3 py-1">
                  {p.status}
                </span>
                <DuplicarProjetoButton projetoId={p.id} nomeAtual={p.nome_obra || ''} />
                <ExcluirProjetoButton projetoId={p.id} nomeAtual={p.nome_obra || ''} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
