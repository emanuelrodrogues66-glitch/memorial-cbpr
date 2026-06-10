import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '../dashboard/LogoutButton';
import LeadsTable from './LeadsTable';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('memorial_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  const total = leads?.length || 0;
  const novos = leads?.filter((l) => l.status === 'novo').length || 0;
  const cidades = Array.from(new Set((leads || []).map((l) => l.cidade).filter(Boolean))) as string[];

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold text-ink">Memorial CBPR</Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/dashboard" className="text-muted hover:text-ink">Projetos</Link>
              <Link href="/leads" className="text-ink hover:text-primary">Leads</Link>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-ink">Leads</h1>
            <p className="text-sm text-muted mt-1">
              Clientes que consultaram exigências pelo formulário público
              {' '}<Link href="/consulta" target="_blank" className="text-primary hover:underline">/consulta</Link>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Total" value={total} />
          <StatCard label="Novos" value={novos} cor="text-primary" />
          <StatCard label="Cidades" value={cidades.length} />
        </div>

        <LeadsTable leads={leads || []} />
      </section>
    </main>
  );
}

function StatCard({ label, value, cor = 'text-ink' }: { label: string; value: number; cor?: string }) {
  return (
    <div className="card text-center">
      <div className={`text-3xl font-bold ${cor}`}>{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}
