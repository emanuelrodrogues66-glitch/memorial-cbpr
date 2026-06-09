// Gera o memorial em DOCX usando a lib `docx`.
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle
} from 'docx';
import { getMedidasCSCIP } from './cscip-medidas';

function medidasComStatusDocx(
  d: any
): { nome: string; status: 'EXIGIDO' | 'CONDICIONAL'; observacao?: string }[] {
  const escolhidas = new Set<string>(d.medidas_protecao ?? []);
  const lista = getMedidasCSCIP(
    d.divisao ?? '',
    Number(d.area_construida_m2) || 0,
    Number(d.altura_edificacao_m) || 0
  ).medidas;
  if (lista.length === 0) {
    return (d.medidas_protecao ?? []).map((nome: string) => ({
      nome,
      status: 'EXIGIDO' as const
    }));
  }
  const out: { nome: string; status: 'EXIGIDO' | 'CONDICIONAL'; observacao?: string }[] = [];
  for (const m of lista) {
    if (m.status === 'EXIGIDO') out.push({ nome: m.nome, status: 'EXIGIDO', observacao: m.observacao });
    else if (m.status === 'CONDICIONAL' && escolhidas.has(m.nome))
      out.push({ nome: m.nome, status: 'CONDICIONAL', observacao: m.observacao });
  }
  return out;
}

function row(k: string, v: any) {
  const val = v == null || v === '' ? '—' : String(v);
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 38, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: k, color: '7A7974' })] })]
      }),
      new TableCell({
        width: { size: 62, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: val, bold: true })] })]
      })
    ]
  });
}

function tabela(rows: TableRow[]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'D4D1CA' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D4D1CA' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'D4D1CA' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
    }
  });
}

function h(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 120 }
  });
}

export async function gerarDocxBlob(d: any): Promise<Blob> {
  const children: any[] = [
    new Paragraph({
      children: [new TextRun({ text: 'Memorial Descritivo de Segurança Contra Incêndio', bold: true, size: 32 })],
      alignment: AlignmentType.LEFT
    }),
    new Paragraph({
      children: [new TextRun({
        text: 'Conforme normativas do Corpo de Bombeiros do Paraná (CBPR) — NPTs 005, 008, 011, 017',
        color: '7A7974', size: 18
      })]
    }),

    h('1. Dados da obra'),
    tabela([
      row('Nome da obra', d.nome_obra),
      row('Proprietário', d.proprietario),
      row('CPF / CNPJ', d.cpf_cnpj),
      row('Endereço', d.endereco),
      row('Cidade / UF', `${d.cidade ?? ''} / ${d.uf ?? ''}`),
      row('CEP', d.cep),
      row('Telefone', d.telefone),
      row('E-mail', d.email_contato)
    ]),

    h('2. Classificação da edificação'),
    tabela([
      row('CNAE', d.cnae),
      row('Atividade', d.descricao_atividade),
      row('Grupo / Ocupação', `${d.grupo ?? ''} • ${d.ocupacao ?? ''}`),
      row('Divisão', d.divisao),
      row('Carga de incêndio', d.carga_incendio_mj_m2 ? `${d.carga_incendio_mj_m2} MJ/m²` : '—'),
      row('Risco', d.risco_incendio)
    ]),

    h('3. Características físicas'),
    tabela([
      row('Área do terreno', d.area_total_m2 ? `${d.area_total_m2} m²` : '—'),
      row('Área construída', d.area_construida_m2 ? `${d.area_construida_m2} m²` : '—'),
      row('Altura da edificação', d.altura_edificacao_m ? `${d.altura_edificacao_m} m` : '—'),
      row('Pavimentos', d.numero_pavimentos),
      row('Tipo (NPT 005)', d.tipo_edificacao),
      row('Classe (NPT 008)', d.classe_npt008),
      row('TRRF', d.trrf_minutos != null ? `${d.trrf_minutos} min` : 'sem regra')
    ]),

    h('4. População e saídas (NPT 011)'),
    tabela([
      row('População', d.populacao_calculada),
      row('Critério', d.populacao_descricao_npt011),
      row('Unid. passagem — acesso/descarga', d.unidades_passagem_acesso),
      row('Unid. passagem — escada', d.unidades_passagem_escada),
      row('Unid. passagem — porta', d.unidades_passagem_porta)
    ]),

    h('5. Brigada de incêndio (NPT 017)'),
    tabela([
      row('Brigadistas', d.brigadistas_necessarios),
      row('Critério', d.brigadistas_descricao)
    ]),

    h('6. Medidas de segurança contra incêndio (CSCIP/PR)'),
    ...medidasComStatusDocx(d).flatMap((m) => {
      const tag = m.status === 'EXIGIDO' ? 'Exigido' : 'Condicional';
      const cor = m.status === 'EXIGIDO' ? 'A32D2D' : '854F0B';
      const linhas = [
        new Paragraph({
          spacing: { after: 30 },
          children: [
            new TextRun({ text: `• ${m.nome}  ` }),
            new TextRun({ text: `[${tag}]`, color: cor, bold: true, size: 16 })
          ]
        })
      ];
      if (m.observacao) {
        linhas.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: `   ${m.observacao}`, color: '7A7974', italics: true, size: 16 })
            ]
          })
        );
      }
      return linhas;
    }),

    h('7. Responsável técnico'),
    tabela([
      row('Nome', d.responsavel_tecnico),
      row('CREA / CAU', d.crea_resp)
    ])
  ];

  if (d.observacoes) {
    children.push(h('Observações'));
    children.push(new Paragraph({ text: d.observacoes }));
  }

  children.push(new Paragraph({
    children: [new TextRun({
      text: 'Documento gerado eletronicamente. Os cálculos seguem regras simplificadas das NPTs do CBPR e devem ser validados pelo responsável técnico antes do protocolo.',
      color: '7A7974', size: 16, italics: true
    })],
    spacing: { before: 360 }
  }));

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22 } }
      }
    },
    sections: [{ children }]
  });

  return await Packer.toBlob(doc);
}
