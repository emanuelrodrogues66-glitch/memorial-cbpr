'use client';
import { useState, useEffect } from 'react';
// ... demais imports

export default function GerarClient({ dados }: { dados: any }) {
  const storageKey = `secoes-memorial-${dados.id}`; // chave única por projeto

  const [secoes, setSecoes] = useState<SecaoMemorial[]>(() => {
    // Inicializa do localStorage; se não tiver, usa todas
    if (typeof window === 'undefined') return SECOES_TODAS;
    try {
      const salvo = localStorage.getItem(storageKey);
      if (salvo) return JSON.parse(salvo) as SecaoMemorial[];
    } catch {}
    return SECOES_TODAS;
  });

  // Persiste sempre que a seleção mudar
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(secoes));
  }, [secoes, storageKey]);

  // ... resto do componente sem alteração
