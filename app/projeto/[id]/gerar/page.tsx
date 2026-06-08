import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GerarClient from './GerarClient';
import Link from 'next/link';
import { calcular } from '@/lib/calculos';

export const dynamic = 'force-dynamic';

export default async function GerarPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: projeto } = await supabase
    .from('memorial_projetos')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();
  if (!projeto) notFound();

  const calc = calcular(projeto.dados ?? {});
  const total = { ...(projeto.dados ?? {}), ...calc, nome_obra: projeto.nome_obra };

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-white">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/projeto/${projeto.id}`} className="text-sm text-muted hover:text-ink">
              ← Voltar ao formulário
            </Link>
            <div className="font-semibold text-ink">{projeto.nome_obra}</div>
          </div>
        </div>
      </header>
      <section className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold">Gerar documentos</h1>
        <p className="text-sm text-muted mt-2">
          Os arquivos são montados no seu navegador a partir dos dados do projeto e baixados localmente.
        </p>
        <GerarClient dados={total} />
      </section>
    </main>
  );
}
