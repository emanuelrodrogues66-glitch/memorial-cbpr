'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CadastroPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    full_name: '',
    empresa: '',
    crea: '',
    telefone: '',
    email: '',
    pwd: ''
  });
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null); setBusy(true);
    const { error, data } = await supabase.auth.signUp({
      email: form.email,
      password: form.pwd,
      options: {
        data: {
          full_name: form.full_name,
          empresa: form.empresa,
          crea: form.crea,
          telefone: form.telefone
        }
      }
    });
    if (error) { setBusy(false); setErr(error.message); return; }

    // Atualiza o profile criado pelo trigger
    if (data.user) {
      await supabase.from('memorial_profiles').update({
        full_name: form.full_name,
        empresa: form.empresa,
        crea: form.crea,
        telefone: form.telefone,
        email: form.email
      }).eq('id', data.user.id);
    }

    setBusy(false);
    if (data.session) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setMsg('Conta criada. Verifique seu e-mail para confirmar e depois entre.');
    }
  }

  function up<K extends keyof typeof form>(k: K, v: string) {
    setForm({ ...form, [k]: v });
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={cadastrar} className="card w-full max-w-lg space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Criar conta</h1>
          <p className="text-sm text-muted mt-1">Para profissionais habilitados (CREA/CAU).</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="field-group sm:col-span-2">
            <label className="label">Nome completo</label>
            <input className="input" required value={form.full_name} onChange={e => up('full_name', e.target.value)} />
          </div>
          <div className="field-group">
            <label className="label">Empresa</label>
            <input className="input" value={form.empresa} onChange={e => up('empresa', e.target.value)} />
          </div>
          <div className="field-group">
            <label className="label">CREA / CAU</label>
            <input className="input" value={form.crea} onChange={e => up('crea', e.target.value)} placeholder="Ex.: 190806/D" />
          </div>
          <div className="field-group">
            <label className="label">Telefone</label>
            <input className="input" value={form.telefone} onChange={e => up('telefone', e.target.value)} />
          </div>
          <div className="field-group">
            <label className="label">E-mail</label>
            <input type="email" className="input" required value={form.email} onChange={e => up('email', e.target.value)} />
          </div>
          <div className="field-group sm:col-span-2">
            <label className="label">Senha (mín. 6 caracteres)</label>
            <input type="password" minLength={6} className="input" required value={form.pwd} onChange={e => up('pwd', e.target.value)} />
          </div>
        </div>
        {err && <div className="text-sm text-danger bg-danger/5 px-3 py-2 rounded">{err}</div>}
        {msg && <div className="text-sm text-success bg-success/5 px-3 py-2 rounded">{msg}</div>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Criando…' : 'Criar conta'}
        </button>
        <div className="text-sm text-muted text-center">
          Já tem conta?{' '}
          <Link href="/login" className="text-primary hover:underline">Entrar</Link>
        </div>
      </form>
    </main>
  );
}
