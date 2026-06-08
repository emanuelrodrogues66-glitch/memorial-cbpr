# Memorial Descritivo CBPR

App web para elaboração de memoriais descritivos de segurança contra incêndio conforme normas do Corpo de Bombeiros do Paraná (CBPR).

## Funcionalidades

- Login multi-usuário (cada projeto privado por conta)
- Formulário guiado em 6 etapas com salvamento automático
- Base com 1.332 CNAEs e classificação automática por divisão (A a M)
- Cálculos automáticos conforme NPTs:
  - TRRF por NPT 008
  - População e saídas por NPT 011
  - Brigada de incêndio por NPT 017
  - Sugestão de medidas de segurança
- Geração de documentos em PDF, DOCX e XLSX prontos para entrega

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres + RLS)
- @react-pdf/renderer, docx, exceljs

## Setup local

```bash
npm install
cp .env.local.example .env.local  # preencha as chaves do Supabase
npm run dev
```

Variáveis de ambiente necessárias:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Deploy

Hospedado na Vercel: https://memorial-cbpr.vercel.app
