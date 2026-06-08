'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={entrar} className="card w-full max-w-md space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Entrar</h1>
          <p className="text-sm text-muted mt-1">Acesse seus memoriais e projetos.</p>
        </div>
        <div className="field-group">
          <label className="label">E-mail</label>
          <input
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="field-group">
          <label className="label">Senha</label>
          <input
            type="password"
            required
            className="input"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {err && <div className="text-sm text-danger bg-danger/5 px-3 py-2 rounded">{err}</div>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
        <div className="text-sm text-muted text-center">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-primary hover:underline">Crie a sua</Link>
        </div>
      </form>
    </main>
  );
}
