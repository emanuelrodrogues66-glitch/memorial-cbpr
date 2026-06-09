// app/api/revit/saidas/route.ts
//
// Recebe pavimentos do plugin Revit (MemorialCBPR) e grava em
// memorial_projetos.dados.saidas_pavimentos.
//
// Autenticacao: header Authorization: Bearer <revit_token>
// O token e unico por projeto e fica disponivel na pagina do projeto no app.
// Nao precisa de login do usuario, nao precisa de URL ou chave Supabase.
//
// Aceita payload em camelCase (do plugin C#) e snake_case (do app).

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

// -----------------------------------------------------------------------
// Schemas (aceita camelCase OU snake_case)
// -----------------------------------------------------------------------
const AmbienteSchema = z.object({
  id: z.number(),
  nome: z.string(),
  div: z
    .string()
    .regex(/^[A-M]-\d{1,2}$/, 'Divisao CSCIP invalida (ex: D-1, F-2)')
    .or(z.literal('')),
  area: z.number().min(0),
  excluir: z.number().min(0).default(0)
});

const ComponentesAtivosSchema = z.object({
  porta: z.boolean(),
  escada: z.boolean(),
  acesso: z.boolean()
});

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
    // 1. Extrai o token Bearer
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';

    if (!token) {
      return NextResponse.json(
        {
          error:
            'Token de autenticacao ausente. Envie o header Authorization: Bearer <token>. O token esta na pagina do projeto no app.'
        },
        { status: 401 }
      );
    }

    // 2. Valida payload
    const body = await req.json();
    const parsed = PayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload invalido', detalhes: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { projeto_id, pavimentos } = parsed.data;

    // 3. Chama a RPC do Supabase que valida token e grava
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createSupabaseClient(url, anonKey);

    const { data, error } = await supabase.rpc('revit_update_saidas', {
      p_token: token,
      p_projeto_id: projeto_id,
      p_pavimentos: pavimentos
    });

    if (error) {
      // Token invalido = SQLSTATE 28000
      const isAuthError = error.code === '28000' || /token/i.test(error.message);
      return NextResponse.json(
        { error: isAuthError ? 'Token invalido ou projeto nao encontrado' : error.message },
        { status: isAuthError ? 401 : 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      pavimentos_importados: pavimentos.length,
      ambientes_importados: pavimentos.reduce((s, p) => s + p.ambientes.length, 0),
      rpc: data
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// CORS preflight para o plugin desktop (origin null)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, content-type'
    }
  });
}
