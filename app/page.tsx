import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-semibold text-ink">Memorial CBPR</div>
          <nav className="flex gap-3">
            <Link href="/login" className="btn-secondary">Entrar</Link>
            <Link href="/cadastro" className="btn-primary">Criar conta</Link>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold tracking-tight text-ink leading-tight">
            Memoriais descritivos do Corpo de Bombeiros do Paraná, em minutos.
          </h1>
          <p className="mt-6 text-lg text-muted">
            Preencha um formulário guiado, deixe que o sistema aplique as NPTs 005, 008, 011 e 017
            e baixe seu memorial em PDF, Word e Excel pronto para protocolar.
          </p>
          <div className="mt-10 flex gap-3">
            <Link href="/cadastro" className="btn-primary text-base px-6 py-3">Começar agora</Link>
            <Link href="/login" className="btn-secondary text-base px-6 py-3">Já tenho conta</Link>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-6">
          <Feature
            title="Classificação automática"
            body="Catálogo completo com 1.332 CNAEs classificados por grupo, divisão e carga de incêndio."
          />
          <Feature
            title="Cálculos por NPT"
            body="TRRF (NPT 008), saídas e população (NPT 011) e brigada (NPT 017) calculados em tempo real."
          />
          <Feature
            title="Documentos prontos"
            body="Geração simultânea em PDF, DOCX e XLSX com todos os campos preenchidos automaticamente."
          />
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        Para uso de profissionais habilitados (CREA/CAU). Conteúdo conforme normativas CBPR.
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </div>
  );
}
