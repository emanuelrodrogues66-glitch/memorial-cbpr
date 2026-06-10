'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ExcluirProjetoButton({ projetoId, nomeAtual }: { projetoId: string; nomeAtual: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  async function excluir(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (carregando) return;

    const nome = nomeAtual || 'sem nome';
    const confirmar = confirm(
      `Excluir o projeto "${nome}"?\n\nEsta ação não pode ser desfeita.`
    );
    if (!confirmar) return;

    setCarregando(true);
    try {
      const { error } = await supabase
        .from('memorial_projetos')
        .delete()
        .eq('id', projetoId);

      if (error) {
        alert('Não foi possível excluir o projeto: ' + error.message);
        return;
      }

      router.refresh();
    } finally {
      setCarregando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={excluir}
      disabled={carregando}
      className="text-xs px-3 py-1 rounded-full border border-border text-danger hover:bg-danger hover:text-white hover:border-danger transition disabled:opacity-50"
      title="Excluir projeto"
      aria-label="Excluir projeto"
    >
      {carregando ? 'Excluindo…' : 'Excluir'}
    </button>
  );
}
