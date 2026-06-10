import Link from 'next/link';
import ConsultaForm from './ConsultaForm';

export const metadata = {
  title: 'Consulta gratuita — Memorial CBPR',
  description: 'Descubra em segundos quais medidas de segurança contra incêndio o Corpo de Bombeiros do Paraná exige para sua edificação.'
};

export default function ConsultaPage() {
  return (
    <main className="min-h-screen bg-bg">
      <header className="border-b border-border bg-white">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-ink">Memorial CBPR</Link>
          <nav className="flex gap-3">
            <Link href="/login" className="btn-secondary text-sm">Sou cliente cadastrado</Link>
          </nav>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-ink tracking-tight">
            Consulta gratuita de exigências
          </h1>
          <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
            Informe os dados da edificação e descubra em segundos quais medidas de segurança contra incêndio o Corpo de Bombeiros do Paraná vai exigir.
          </p>
        </div>

        <ConsultaForm />
      </section>
    </main>
  );
}
