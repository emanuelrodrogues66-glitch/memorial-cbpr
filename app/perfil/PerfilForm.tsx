'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PerfilForm({ profile }: { profile: any }) {
  const supabase = createClient();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    empresa: profile?.empresa ?? '',
    cnpj: profile?.cnpj ?? '',
    crea: profile?.crea ?? '',
    telefone: profile?.telefone ?? '',
    email: profile?.email ?? ''
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  function up(k: string, v: string) { setForm({ ...form, [k]: v }); }

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const { error } = await supabase.from('memorial_profiles').upsert({ id: profile.id, ...form });
    setBusy(false);
    setMsg(error ? `Erro: ${error.message}` : 'Perfil salvo.');
  }

  return (
    <form onSubmit={salvar} className="card space-y-4">
      <h1 className="text-2xl font-bold">Meu perfil</h1>
      <p className="text-sm text-muted">Esses dados são pré-preenchidos nos novos memoriais.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Nome completo"><input className="input" value={form.full_name} onChange={e => up('full_name', e.target.value)} /></Field>
        <Field label="Empresa"><input className="input" value={form.empresa} onChange={e => up('empresa', e.target.value)} /></Field>
        <Field label="CNPJ"><input className="input" value={form.cnpj} onChange={e => up('cnpj', e.target.value)} /></Field>
        <Field label="CREA / CAU"><input className="input" value={form.crea} onChange={e => up('crea', e.target.value)} /></Field>
        <Field label="Telefone"><input className="input" value={form.telefone} onChange={e => up('telefone', e.target.value)} /></Field>
        <Field label="E-mail"><input type="email" className="input" value={form.email} onChange={e => up('email', e.target.value)} /></Field>
      </div>
      {msg && <div className="text-sm">{msg}</div>}
      <div className="flex justify-end">
        <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
