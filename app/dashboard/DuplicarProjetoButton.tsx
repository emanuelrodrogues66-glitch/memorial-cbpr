'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DuplicarProjetoButton({ projetoId, nomeAtual }: { projetoId: string; nomeAtual: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  async function duplicar(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (carregando) return;
    const confirmar = confirm(`Duplicar o projeto "${nomeAtual || 'sem nome'}"?`);
    if (!confirmar) return;

    setCarregando(true);
    try {
      // Busca o projeto original
      const { data: original, error: errOrig } = await supabase
        .from('memorial_projetos')
        .select('nome_obra, dados, status')
        .eq('id', projetoId)
        .maybeSingle();
      if (errOrig || !original) {
        alert('Não foi possível carregar o projeto original.');
        return;
      }

      // Pega o usuário atual para garantir o user_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Sessão expirada. Faça login novamente.');
        return;
      }

      const nomeCopia = `Cópia de ${original.nome_obra || 'Projeto sem nome'}`;
      const { data: novo, error: errIns } = await supabase
        .from('memorial_projetos')
        .insert({
          user_id: user.id,
          nome_obra: nomeCopia,
          status: 'rascunho',
          dados: original.dados ?? {}
        })
        .select('id')
        .single();

      if (errIns || !novo) {
        alert('Não foi possível duplicar o projeto: ' + (errIns?.message || 'erro desconhecido'));
        return;
      }

      router.push(`/projeto/${novo.id}`);
      router.refresh();
    } finally {
      setCarregando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={duplicar}
      disabled={carregando}
      className="text-xs px-3 py-1 rounded-full border border-border text-muted hover:text-ink hover:border-ink transition disabled:opacity-50"
      title="Duplicar projeto"
      aria-label="Duplicar projeto"
    >
      {carregando ? 'Duplicando…' : 'Duplicar'}
    </button>
  );
}
