'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NovoProjetoButton() {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function criar() {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('memorial_projetos')
      .insert({
        user_id: user.id,
        nome_obra: 'Novo projeto',
        status: 'rascunho',
        dados: {}
      })
      .select()
      .single();
    setBusy(false);
    if (error) { alert(error.message); return; }
    router.push(`/projeto/${data.id}`);
  }

  return (
    <button onClick={criar} disabled={busy} className="btn-primary">
      {busy ? 'Criando…' : '+ Novo projeto'}
    </button>
  );
}
