// Gera o memorial em DOCX usando a lib `docx`.
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle
} from 'docx';
import { getMedidasCSCIP } from './cscip-medidas';
import { dimensionarTodos, DATA_SAIDAS, type Pavimento, type DimPavimento } from './saidas-npt011';

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

function cellText(text: string, opts: { bold?: boolean; color?: string; bg?: string; size?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  const cellOpts: any = {
    children: [
      new Paragraph({
        alignment: opts.align,
        children: [
          new TextRun({
            text,
            bold: opts.bold,
            color: opts.color,
            size: opts.size ?? 16
          })
        ]
      })
    ]
  };
  if (opts.bg) cellOpts.shading = { type: 'clear', fill: opts.bg, color: 'auto' };
  return new TableCell(cellOpts);
}

function renderSaidasDocx(d: any): any[] {
  const pavs: Pavimento[] = Array.isArray(d.saidas_pavimentos) ? d.saidas_pavimentos : [];
  if (pavs.length === 0) {
    return [
      tabela([
        row('População', d.populacao_calculada),
        row('Critério', d.populacao_descricao_npt011),
        row('Unid. passagem — acesso/descarga', d.unidades_passagem_acesso),
        row('Unid. passagem — escada', d.unidades_passagem_escada),
        row('Unid. passagem — porta', d.unidades_passagem_porta)
      ])
    ];
  }
  const dims: DimPavimento[] = dimensionarTodos(pavs);
  const out: any[] = [];

  for (const dim of dims) {
    out.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: `DIMENSIONAMENTO DAS SAÍDAS — ${dim.label}`.toUpperCase(), bold: true, size: 20 })]
      })
    );

    // Tabela de ambientes (estilo Excel da imagem)
    const headerRow = new TableRow({
      tableHeader: true,
      children: [
        cellText('Ambiente', { bold: true, bg: 'F2F2F2' }),
        cellText('Ocupação', { bold: true, bg: 'F2F2F2', align: AlignmentType.CENTER }),
        cellText('Área (m²)', { bold: true, bg: 'F2F2F2', align: AlignmentType.CENTER }),
        cellText('População/m²', { bold: true, bg: 'F2F2F2', align: AlignmentType.CENTER }),
        cellText('População total', { bold: true, bg: 'F2F2F2', align: AlignmentType.CENTER })
      ]
    });
    const dataRows = dim.por_ambiente.map((a) =>
      new TableRow({
        children: [
          cellText(a.nome),
          cellText(a.divisao, { align: AlignmentType.CENTER }),
          cellText(a.net.toFixed(2), { align: AlignmentType.CENTER }),
          cellText(DATA_SAIDAS[a.divisao]?.pop ?? '—', { align: AlignmentType.CENTER }),
          cellText(`${a.pop} pessoas`, { align: AlignmentType.CENTER, bold: true })
        ]
      })
    );
    const totalRow = new TableRow({
      children: [
        cellText('População total do pavimento', { bold: true, bg: 'FFF2CC' }),
        cellText('', { bg: 'FFF2CC' }),
        cellText('', { bg: 'FFF2CC' }),
        cellText('', { bg: 'FFF2CC' }),
        cellText(`${dim.populacao_total} pessoas`, { bold: true, bg: 'FFF2CC', align: AlignmentType.CENTER })
      ]
    });
    out.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows, totalRow],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
          left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
          right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: '808080' },
          insideVertical: { style: BorderStyle.SINGLE, size: 2, color: '808080' }
        }
      })
    );

    // Dimensionamento por componente
    for (const comp of dim.dimensionamento) {
      out.push(
        new Paragraph({
          spacing: { before: 160, after: 60 },
          children: [new TextRun({ text: `${comp.label.toUpperCase()} — C=${comp.c_critico}`, bold: true, size: 18, color: '01696F' })]
        })
      );
      const N = Math.max(1, Math.ceil(dim.populacao_total / Math.max(comp.c_critico, 1)));
      const upFinal = comp.total_up;
      const larg = comp.total_largura_m.toFixed(2);
      out.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `N = P/C = ${dim.populacao_total}/${comp.c_critico} = ${N} unidade(s) de passagem`, size: 18 })
          ]
        })
      );
      out.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: `Largura — ${comp.label.toLowerCase()}: ${upFinal} UP × 0,55 m = ${larg} m (mínimo ${comp.min_largura.toFixed(2)} m)`, bold: true, size: 18 })
          ]
        })
      );
    }

    // Verificação das saídas existentes
    if (dim.verificacao.length > 0 && dim.verificacao.some((v) => v.quantidade_elementos > 0)) {
      out.push(
        new Paragraph({
          spacing: { before: 160, after: 60 },
          children: [new TextRun({ text: 'VERIFICAÇÃO DAS SAÍDAS EXISTENTES', bold: true, size: 18, color: '01696F' })]
        })
      );
      const verifHeader = new TableRow({
        tableHeader: true,
        children: [
          cellText('Componente', { bold: true, bg: 'F2F2F2' }),
          cellText('Exigido', { bold: true, bg: 'F2F2F2', align: AlignmentType.CENTER }),
          cellText('Real', { bold: true, bg: 'F2F2F2', align: AlignmentType.CENTER }),
          cellText('Resultado', { bold: true, bg: 'F2F2F2', align: AlignmentType.CENTER })
        ]
      });
      const verifRows = dim.verificacao.map((v) =>
        new TableRow({
          children: [
            cellText(v.label),
            cellText(`${v.up_exigido} UP / ${v.largura_exigida_m.toFixed(2)} m`, { align: AlignmentType.CENTER }),
            cellText(`${v.up_real} UP / ${v.largura_real_m.toFixed(2)} m (${v.quantidade_elementos} un)`, { align: AlignmentType.CENTER }),
            cellText(v.atende ? 'ATENDE' : 'NÃO ATENDE', {
              bold: true,
              align: AlignmentType.CENTER,
              color: 'FFFFFF',
              bg: v.atende ? '437A22' : 'A12C7B'
            })
          ]
        })
      );
      out.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [verifHeader, ...verifRows],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: '808080' },
            insideVertical: { style: BorderStyle.SINGLE, size: 2, color: '808080' }
          }
        })
      );
      // Detalhes textuais dos elementos
      for (const v of dim.verificacao) {
        if (v.quantidade_elementos > 0) {
          out.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: `• ${v.label}: ${v.detalhes}`, size: 16, color: '7A7974' })]
            })
          );
        }
      }
    }

    out.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: 'Para a presente edificação foram dimensionadas as saídas conforme NPT 011, considerando o C mais restritivo dos ambientes (item 5.3.2.2). UP = 0,55 m.',
            italics: true,
            color: '7A7974',
            size: 16
          })
        ]
      })
    );
  }

  if (dims.length > 1) {
    const total = dims.reduce((s, x) => s + x.populacao_total, 0);
    out.push(
      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: `População total (todos os pavimentos): ${total} pessoas`, bold: true, size: 20 })]
      })
    );
  }

  return out;
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

    h('4. Memorial de saídas (NPT 011)'),
    ...renderSaidasDocx(d),

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
