'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Item = {
  email: string;
  created_at: string;
};

export default function AdminAllowlist({
  initial,
  currentUserEmail,
}: {
  initial: Item[];
  currentUserEmail: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<Item[]>(initial);
  const [novoEmail, setNovoEmail] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);

  const adicionar = async () => {
    setErro(null);
    setSucesso(null);
    const email = novoEmail.trim().toLowerCase();
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      setErro('Email inválido');
      return;
    }
    if (items.some((i) => i.email.toLowerCase() === email)) {
      setErro('Este email já está na lista');
      return;
    }

    setSalvando(true);
    const { data, error } = await supabase
      .from('allowed_admins')
      .insert({ email })
      .select()
      .single();
    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }
    setItems([...items, data as Item]);
    setNovoEmail('');
    setSucesso(`${email} liberado para cadastro`);
    router.refresh();
  };

  const remover = async (email: string) => {
    if (email.toLowerCase() === currentUserEmail.toLowerCase()) {
      setErro('Você não pode remover o próprio email');
      return;
    }
    if (!confirm(`Remover ${email} da lista de cadastros permitidos?`)) return;

    setErro(null);
    setSucesso(null);
    setRemovendo(email);
    const { error } = await supabase
      .from('allowed_admins')
      .delete()
      .eq('email', email);
    setRemovendo(null);

    if (error) {
      setErro(error.message);
      return;
    }
    setItems(items.filter((i) => i.email !== email));
    setSucesso(`${email} removido`);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-base font-semibold text-ink mb-3">Liberar novo cadastro</h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionar()}
            className="input flex-1"
            placeholder="email@exemplo.com"
          />
          <button
            onClick={adicionar}
            disabled={salvando || !novoEmail.trim()}
            className="btn-primary disabled:opacity-50 whitespace-nowrap"
          >
            {salvando ? 'Salvando...' : 'Liberar'}
          </button>
        </div>
        {erro && (
          <div className="mt-3 text-sm text-danger bg-danger/10 px-3 py-2 rounded">
            {erro}
          </div>
        )}
        {sucesso && (
          <div className="mt-3 text-sm text-success bg-success/10 px-3 py-2 rounded">
            {sucesso}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-ink">Emails autorizados</h2>
          <span className="text-xs text-muted">{items.length} {items.length === 1 ? 'conta' : 'contas'}</span>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted py-4 text-center">
            Nenhum email cadastrado. Adicione o primeiro acima.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => {
              const isOwner = item.email.toLowerCase() === currentUserEmail.toLowerCase();
              return (
                <div key={item.email} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink truncate">
                      {item.email}
                      {isOwner && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                          você
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted">
                      Adicionado em {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <button
                    onClick={() => remover(item.email)}
                    disabled={isOwner || removendo === item.email}
                    className="text-sm text-danger hover:underline disabled:text-muted disabled:no-underline disabled:cursor-not-allowed"
                  >
                    {removendo === item.email ? 'Removendo...' : 'Remover'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
