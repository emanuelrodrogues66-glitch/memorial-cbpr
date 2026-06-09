// app/api/revit/saidas/route.ts
//
// Recebe os pavimentos enviados pelo plugin Revit (MemorialCBPR) e grava em
// memorial_projetos.dados.saidas_pavimentos.
//
// O plugin C# serializa em camelCase (componentesAtivos / saidasReais), mas o
// app usa snake_case (componentes_ativos / saidas_reais). Este endpoint aceita
// ambos os formatos e normaliza para snake_case antes de gravar.
//
// POST /api/revit/saidas
// Headers: Authorization: Bearer <supabase_access_token>  (opcional, se passar usa sessão)
// Body:    { projeto_id: string, pavimentos: Pavimento[] }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// -----------------------------------------------------------------------
// Schemas (aceita camelCase OU snake_case)
// -----------------------------------------------------------------------
const AmbienteSchema = z.object({
  id: z.number(),
  nome: z.string(),
  div: z.string().regex(/^[A-M]-\d{1,2}$/, 'Divisão CSCIP inválida (ex: D-1, F-2)').or(z.literal('')),
  area: z.number().min(0),
  excluir: z.number().min(0).default(0)
});

const ComponentesAtivosSchema = z.object({
  porta: z.boolean(),
  escada: z.boolean(),
  acesso: z.boolean()
});

// Aceita as duas grafias e mapeia para snake_case
const PavimentoSchema = z
  .object({
    id: z.number(),
    label: z.string(),
    componentesAtivos: ComponentesAtivosSchema.optional(),
    componentes_ativos: ComponentesAtivosSchema.optional(),
    ambientes: z.array(AmbienteSchema).min(1),
    saidasReais: z.array(z.any()).optional(),
    saidas_reais: z.array(z.any()).optional()
  })
  .transform((p) => ({
    id: p.id,
    label: p.label,
    componentes_ativos:
      p.componentes_ativos ??
      p.componentesAtivos ?? { porta: true, escada: false, acesso: false },
    ambientes: p.ambientes,
    saidas_reais: p.saidas_reais ?? p.saidasReais ?? []
  }));

const PayloadSchema = z.object({
  projeto_id: z.string().uuid(),
  pavimentos: z.array(PavimentoSchema).min(1)
});

// -----------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido', detalhes: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { projeto_id, pavimentos } = parsed.data;

    const supabase = createClient();

    // Verifica autenticação — depende da política RLS do Supabase
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        {
          error:
            'Não autenticado. O plugin Revit precisa de um access token válido (Supabase anon + login do usuário).'
        },
        { status: 401 }
      );
    }

    // Verifica ownership do projeto
    const { data: projeto, error: errProjeto } = await supabase
      .from('memorial_projetos')
      .select('id, dados')
      .eq('id', projeto_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (errProjeto || !projeto) {
      return NextResponse.json(
        { error: 'Projeto não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    // Merge: preserva todos os dados existentes, substitui apenas saidas_pavimentos
    const dadosAtualizados = {
      ...(projeto.dados as Record<string, unknown>),
      saidas_pavimentos: pavimentos
    };

    const { error: errUpdate } = await supabase
      .from('memorial_projetos')
      .update({ dados: dadosAtualizados })
      .eq('id', projeto_id);

    if (errUpdate) {
      return NextResponse.json({ error: errUpdate.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      pavimentos_importados: pavimentos.length,
      ambientes_importados: pavimentos.reduce((s, p) => s + p.ambientes.length, 0)
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
