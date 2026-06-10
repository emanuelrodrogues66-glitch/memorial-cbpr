import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '../dashboard/LogoutButton';
import AdminAllowlist from './AdminAllowlist';

export const dynamic = 'force-dynamic';

const OWNER_EMAIL = 'emanuelrodrogues66@gmail.com';

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Apenas o owner acessa
  if ((user.email || '').toLowerCase() !== OWNER_EMAIL) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg">
        <div className="card max-w-md text-center">
          <h1 className="text-xl font-semibold text-ink">Acesso restrito</h1>
          <p className="text-sm text-muted mt-2">
            Esta área é exclusiva do administrador da plataforma.
          </p>
          <Link href="/dashboard" className="btn-secondary mt-4 inline-block">
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from('memorial_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const { data: allowed } = await supabase
    .from('allowed_admins')
    .select('*')
    .order('created_at', { ascending: true });

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold text-ink">Memorial CBPR</Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/dashboard" className="text-muted hover:text-ink">Projetos</Link>
              <Link href="/leads" className="text-muted hover:text-ink">Leads</Link>
              <Link href="/admin" className="text-ink hover:text-primary font-medium">Administração</Link>
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

      <section className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink">Administração</h1>
          <p className="text-sm text-muted mt-1">
            Controle quem pode criar conta no painel. Apenas emails desta lista conseguem se cadastrar.
          </p>
        </div>

        <AdminAllowlist
          initial={allowed || []}
          currentUserEmail={user.email || ''}
        />

        <div className="card mt-8">
          <h2 className="text-base font-semibold text-ink mb-2">Como funciona</h2>
          <ul className="text-sm text-muted space-y-1.5 list-disc list-inside">
            <li>Adicione o email aqui antes de pedir para a pessoa se cadastrar.</li>
            <li>O cadastro em <Link href="/cadastro" className="text-primary hover:underline">/cadastro</Link> verifica esta lista antes de criar a conta.</li>
            <li>Remover um email impede novos cadastros mas não desativa contas já existentes.</li>
            <li>Seu próprio email não pode ser removido.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
