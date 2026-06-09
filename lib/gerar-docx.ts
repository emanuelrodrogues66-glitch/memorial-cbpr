// Gera o memorial em DOCX usando a lib `docx`.
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, PageBreak
} from 'docx';
import { dimensionarTodos, DATA_SAIDAS, type Pavimento, type DimPavimento } from './saidas-npt011';
import {
  MEDIDAS_QUADRO_PADRAO,
  medidaAtende,
  textoEstruturas,
  textoAlvenarias,
  textoCompartimentacoes,
  textoCompartimentos,
  textoInstalacoes,
  textoVidros,
  textoMedidasSeguranca,
  textoAcessoViaturas,
  textoTermoSaidas,
  formatarData
} from './textos-padrao';

// ============================================================================
// Helpers
// ============================================================================
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

function h1(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28 })],
    spacing: { before: 240, after: 160 }
  });
}

function h(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 120 }
  });
}

function h3(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 20, color: '28251D' })],
    spacing: { before: 160, after: 80 }
  });
}

function p(text: string, opts: { justify?: boolean; italic?: boolean; bold?: boolean } = {}) {
  return new Paragraph({
    alignment: opts.justify ? AlignmentType.JUSTIFIED : undefined,
    spacing: { after: 100 },
    children: [new TextRun({ text, italics: opts.italic, bold: opts.bold, size: 20 })]
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
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

function assinatura(d: any): any[] {
  const local = d.oficio_local || d.cidade || '';
  const data = formatarData(d.oficio_data) || formatarData(new Date().toISOString());
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 480, after: 240 },
      children: [new TextRun({ text: `${local}${local ? ', ' : ''}${data}`, size: 18, color: '7A7974' })]
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '_____________________________', size: 18 })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: d.responsavel_tecnico || 'Responsável técnico', bold: true, size: 18 })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `CREA / CAU: ${d.crea_resp || '—'}`, size: 16, color: '7A7974' })] })
              ]
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '_____________________________', size: 18 })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: d.proprietario || 'Proprietário', bold: true, size: 18 })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `CPF / CNPJ: ${d.cpf_cnpj || '—'}`, size: 16, color: '7A7974' })] })
              ]
            })
          ]
        })
      ]
    })
  ];
}

// ============================================================================
// Seção: Ofício de apresentação
// ============================================================================
function secOficio(d: any): any[] {
  const local = d.oficio_local || d.cidade || '';
  const data = formatarData(d.oficio_data) || formatarData(new Date().toISOString());
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: 'OFÍCIO DE APRESENTAÇÃO DO PTPID', bold: true, size: 28 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: 'Projeto Técnico de Prevenção a Incêndios e Desastres — CBMPR', size: 18, color: '7A7974' })]
    }),
    p(`${local}${local ? ', ' : ''}${data}`),
    p('Ao'),
    p('Serviço de Prevenção Contra Incêndio e Pânico'),
    p('Corpo de Bombeiros Militar do Paraná'),
    p(`${d.cidade || '—'}-${d.uf || 'PR'}`),
    p('Ilustríssimos Senhores,'),
    p(
      'Em conformidade com o CSCIP-CBMPR, vimos por meio deste solicitar a análise e posterior aprovação ' +
      'do Projeto Técnico de Prevenção a Incêndios e Desastres referente à edificação descrita a seguir:',
      { justify: true }
    ),
    tabela([
      row('Obra', d.nome_obra),
      row('Proprietário', d.proprietario),
      row('CPF / CNPJ', d.cpf_cnpj),
      row('Endereço', d.endereco),
      row('Cidade / UF', `${d.cidade ?? ''} / ${d.uf ?? ''}`),
      row('Ocupação', `${d.ocupacao ?? ''} (${d.divisao ?? ''})`),
      row('Área total', d.area_total_m2 ? `${d.area_total_m2} m²` : '—'),
      row('Área construída', d.area_construida_m2 ? `${d.area_construida_m2} m²` : '—')
    ]),
    p('Restrito ao exposto, antecipadamente agradecemos.', { justify: true }),
    p('Atenciosamente,'),
    ...assinatura(d)
  ];
}

// ============================================================================
// Seção: Classificação + Quadro resumo de medidas (mesmo tópico, mesma página)
// ============================================================================
function secClassificacaoEMedidas(d: any): any[] {
  // Quadro resumo das medidas
  const cabec = new TableRow({
    tableHeader: true,
    children: [
      cellText('MEDIDA DE SEGURANÇA', { bold: true, bg: '01696F', color: 'FFFFFF' }),
      cellText('NORMA APLICÁVEL', { bold: true, bg: '01696F', color: 'FFFFFF', align: AlignmentType.CENTER }),
      cellText('EXIGIDA', { bold: true, bg: '01696F', color: 'FFFFFF', align: AlignmentType.CENTER })
    ]
  });
  const linhasMedidas = MEDIDAS_QUADRO_PADRAO.map((m) => {
    const exigida = medidaAtende(d, m.nome);
    return new TableRow({
      children: [
        cellText(m.nome),
        cellText(exigida ? m.norma : 'NÃO SE APLICA', { align: AlignmentType.CENTER }),
        cellText(exigida ? 'SIM' : 'NÃO', {
          bold: true,
          align: AlignmentType.CENTER,
          color: 'FFFFFF',
          bg: exigida ? '437A22' : 'A12C7B'
        })
      ]
    });
  });
  const tabelaMedidas = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [cabec, ...linhasMedidas],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: '808080' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: '808080' }
    }
  });

  return [
    h1('Classificação da edificação e medidas de segurança'),
    p('Apresentação consolidada da classificação geral, classificação física e quadro resumo das medidas de segurança contra incêndio exigidas (ANEXO F).', { italic: true }),

    h('1. Dados da obra'),
    tabela([
      row('Nome da obra', d.nome_obra),
      row('Proprietário', d.proprietario),
      row('CPF / CNPJ', d.cpf_cnpj),
      row('Endereço', d.endereco),
      row('Cidade / UF', `${d.cidade ?? ''} / ${d.uf ?? ''}`)
    ]),

    h('2. Classificação geral (CNAE / CSCIP)'),
    tabela([
      row('CNAE', d.cnae),
      row('Atividade', d.descricao_atividade),
      row('Grupo / Ocupação', `${d.grupo ?? ''} • ${d.ocupacao ?? ''}`),
      row('Divisão', d.divisao),
      row('Carga de incêndio', d.carga_incendio_mj_m2 ? `${Number(d.carga_incendio_mj_m2).toFixed(2)} MJ/m²` : '—'),
      row('Risco', d.risco_incendio)
    ]),

    h('3. Classificação física'),
    tabela([
      row('Área do terreno', d.area_total_m2 ? `${d.area_total_m2} m²` : '—'),
      row('Área construída', d.area_construida_m2 ? `${d.area_construida_m2} m²` : '—'),
      row('Altura da edificação', d.altura_edificacao_m ? `${d.altura_edificacao_m} m` : '—'),
      row('Pavimentos', d.numero_pavimentos),
      row('Tipo (NPT 005)', d.tipo_edificacao),
      row('Classe (NPT 008)', d.classe_npt008),
      row('TRRF', d.trrf_minutos != null ? `${d.trrf_minutos} min` : 'sem regra')
    ]),

    h('4. Quadro resumo das medidas de segurança contra incêndio'),
    tabelaMedidas
  ];
}

// ============================================================================
// Seção: Memorial básico de construção
// ============================================================================
function secMemorialConstrucao(d: any): any[] {
  return [
    h1('Memorial básico de construção'),
    tabela([
      row('Endereço', d.endereco),
      row('Município', `${d.cidade ?? ''}-${d.uf ?? ''}`),
      row('Proprietário', d.proprietario),
      row('Obra', d.nome_obra),
      row('Ocupação', `${d.ocupacao ?? ''} (${d.divisao ?? ''})`)
    ]),
    h3('1. ESTRUTURAS'),
    p(textoEstruturas(d), { justify: true }),
    h3('2. ALVENARIAS'),
    p(textoAlvenarias(d), { justify: true }),
    h3('3. COMPARTIMENTAÇÕES'),
    p(textoCompartimentacoes(d), { justify: true }),
    h3('4. COMPARTIMENTOS'),
    p(textoCompartimentos(d), { justify: true }),
    h3('5. INSTALAÇÕES'),
    p(textoInstalacoes(d), { justify: true }),
    h3('6. VIDROS'),
    p(textoVidros(d), { justify: true }),
    h3('7. MEDIDAS DE SEGURANÇA CONTRA INCÊNDIO'),
    p(textoMedidasSeguranca(d), { justify: true }),
    ...assinatura(d)
  ];
}

// ============================================================================
// Seção: Planilha de informações operacionais
// ============================================================================
function secInfoOperacional(d: any): any[] {
  const io = d.info_operacional || {};
  const sis = io.sistemas_instalados || {};
  const risc = io.riscos_especiais || {};
  const sistemasNomes = [
    'Hidrantes', 'Chuveiros automáticos', 'Gás carbônico (CO2)', 'Gases especiais',
    'Sistema de detecção', 'Grupo moto gerador', 'Escada pressurizada',
    'Espuma mecânica', 'Sistema de resfriamento', 'Reserva de líquido gerador de espuma',
    'Bombas de recalque'
  ];
  const riscosNomes = [
    'Caldeiras', 'Sistema de GLP', 'Armazenamento de produtos químicos',
    'Central de distribuição elétrica', 'Produtos radioativos', 'Espaços confinados'
  ];

  return [
    h1('Planilha de informações operacionais'),

    h3('1. Informações gerais'),
    tabela([
      row('1.1 Localização', d.endereco),
      row('1.2 Ocupação', `${d.ocupacao ?? ''} (${d.divisao ?? ''})`),
      row('1.3 Área', d.area_construida_m2 ? `${d.area_construida_m2} m²` : '—'),
      row('1.4 Construção', io.tipo_estrutura || d.descricao_atividade),
      row('1.4.2 Acabamento das paredes', io.acabamento_paredes),
      row('1.4.3 Acabamento dos pisos', io.acabamento_pisos),
      row('1.4.4 Cobertura', io.cobertura),
      row('1.5 População fixa', io.populacao_fixa || d.populacao_calculada),
      row('1.5.1 População flutuante', io.populacao_flutuante),
      row('1.5.3 Ponto de encontro', io.ponto_encontro),
      row('1.6 Características', io.caracteristicas_funcionamento),
      row('1.6.2 Horário de funcionamento', io.horario_funcionamento),
      row('1.6.3 Vias de acesso', io.vias_acesso || d.endereco)
    ]),

    h3('2. Recursos humanos'),
    tabela([
      row('2.1 Brigadistas por turno', io.numero_brigadistas || d.brigadistas_necessarios),
      row('2.2 Brigadista profissional', io.brigadista_profissional),
      row('2.3 Encarregado da segurança', io.encarregado_seguranca),
      row('2.4 Telefone de emergência', io.telefone_emergencia || d.telefone)
    ]),

    h3('3. Sistemas instalados'),
    tabela([
      ...sistemasNomes.map((nome) => row(nome, sis[nome] || '—')),
      row('Reservatório — consumo (m³)', io.reserva_consumo),
      row('Reservatório — RTI (m³)', io.reserva_rti),
      row('Reservatório — total (m³)', io.reserva_total)
    ]),

    h3('4. Posto de bombeiros mais próximo'),
    p(io.posto_bombeiros || '—'),

    h3('5. Riscos especiais'),
    tabela([
      ...riscosNomes.map((nome) => row(nome, risc[nome] || '—')),
      row('Outros riscos', io.outros_riscos),
      row('Outras informações úteis', io.outras_informacoes)
    ]),

    ...assinatura(d)
  ];
}

// ============================================================================
// Seção: Memorial de saídas (NPT 011) — preservado do código original
// ============================================================================
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

    for (const comp of dim.dimensionamento) {
      out.push(
        new Paragraph({
          spacing: { before: 160, after: 60 },
          children: [new TextRun({ text: `${comp.label.toUpperCase()} — C=${comp.c_critico}`, bold: true, size: 18, color: '01696F' })]
        })
      );
      const N = Math.max(1, Math.ceil(dim.populacao_total / Math.max(comp.c_critico, 1)));
      const upFinal = comp.total_up;
      const larg = comp.total_largura_m.toFixed(2);
      out.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: `N = P/C = ${dim.populacao_total}/${comp.c_critico} = ${N} unidade(s) de passagem`, size: 18 })]
        })
      );
      out.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: `Largura — ${comp.label.toLowerCase()}: ${upFinal} UP × 0,55 m = ${larg} m (mínimo ${comp.min_largura.toFixed(2)} m)`, bold: true, size: 18 })]
        })
      );
    }

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

// ============================================================================
// Seção: Carga de incêndio (média ponderada)
// ============================================================================
function secCargaIncendio(d: any): any[] {
  const mem = d.carga_incendio_memorial || { itens: [], area_total: 0, ci_total_mj: 0, media_ponderada_mj_m2: 0 };
  const itens = Array.isArray(d.carga_incendio_itens) ? d.carga_incendio_itens : (mem.itens ?? []);
  const out: any[] = [h1('Memorial de cálculo de carga de incêndio')];

  if (!itens || itens.length === 0) {
    out.push(p(
      'A carga de incêndio adotada para o dimensionamento das medidas de segurança foi obtida ' +
      'diretamente da tabela do CSCIP (Anexo A da NPT 014), conforme a ocupação principal da edificação.',
      { justify: true }
    ));
    out.push(tabela([
      row('Ocupação principal', `${d.ocupacao ?? ''} (${d.divisao ?? ''})`),
      row('Carga de incêndio adotada', `${Number(d.carga_incendio_mj_m2 || 0).toFixed(2)} MJ/m²`),
      row('Risco predominante', d.risco_incendio)
    ]));
    out.push(...assinatura(d));
    return out;
  }

  out.push(p(
    'A carga de incêndio total da edificação foi calculada pela média ponderada por área de cada setor ' +
    'de ocupação, conforme NPT 014 e Anexo A do CSCIP/PR.',
    { justify: true }
  ));

  const header = new TableRow({
    tableHeader: true,
    children: [
      cellText('Pavto / Setor', { bold: true, bg: 'FFF2CC' }),
      cellText('Ocupação', { bold: true, bg: 'FFF2CC' }),
      cellText('Divisão', { bold: true, bg: 'FFF2CC', align: AlignmentType.CENTER }),
      cellText('C.I (MJ/m²)', { bold: true, bg: 'FFF2CC', align: AlignmentType.CENTER }),
      cellText('Área (m²)', { bold: true, bg: 'FFF2CC', align: AlignmentType.CENTER }),
      cellText('C.I total', { bold: true, bg: 'FFF2CC', align: AlignmentType.CENTER })
    ]
  });
  const rows = itens.map((it: any) => {
    const ci = Number(it.ci_mj_m2) || 0;
    const a = Number(it.area_m2) || 0;
    return new TableRow({
      children: [
        cellText(it.pavimento_setor || ''),
        cellText(it.ocupacao_descricao || ''),
        cellText(it.divisao || '', { align: AlignmentType.CENTER }),
        cellText(ci.toFixed(2), { align: AlignmentType.CENTER }),
        cellText(a.toFixed(2), { align: AlignmentType.CENTER }),
        cellText((ci * a).toFixed(2), { align: AlignmentType.CENTER, bold: true })
      ]
    });
  });
  const totalRow = new TableRow({
    children: [
      cellText('ÁREA TOTAL', { bold: true, bg: 'FFF2CC' }),
      cellText('', { bg: 'FFF2CC' }),
      cellText('', { bg: 'FFF2CC' }),
      cellText('', { bg: 'FFF2CC' }),
      cellText(mem.area_total.toFixed(2), { bold: true, bg: 'FFF2CC', align: AlignmentType.CENTER }),
      cellText(mem.ci_total_mj.toFixed(2), { bold: true, bg: 'FFF2CC', align: AlignmentType.CENTER })
    ]
  });
  const mediaRow = new TableRow({
    children: [
      cellText('MÉDIA PONDERADA (C.I)', { bold: true, bg: 'D5E3D0' }),
      cellText('', { bg: 'D5E3D0' }),
      cellText('', { bg: 'D5E3D0' }),
      cellText('', { bg: 'D5E3D0' }),
      cellText('', { bg: 'D5E3D0' }),
      cellText(`${mem.media_ponderada_mj_m2.toFixed(2)} MJ/m²`, { bold: true, bg: 'D5E3D0', align: AlignmentType.CENTER })
    ]
  });

  out.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...rows, totalRow, mediaRow],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: '808080' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: '808080' }
    }
  }));
  out.push(tabela([
    row('Risco predominante', d.risco_incendio),
    row('Critério',
      mem.media_ponderada_mj_m2 <= 300 ? 'BAIXO (≤ 300 MJ/m²)' :
      mem.media_ponderada_mj_m2 <= 1200 ? 'MÉDIO (300 < CI ≤ 1200 MJ/m²)' :
      'ALTO (> 1200 MJ/m²)'
    )
  ]));
  out.push(...assinatura(d));
  return out;
}

// ============================================================================
// Seção: Acesso a viaturas
// ============================================================================
function secAcessoViaturas(d: any): any[] {
  const av = d.acesso_viaturas || {};
  const out: any[] = [
    h1('Memorial descritivo — Acesso de viaturas'),
    tabela([
      row('Proprietário', d.proprietario),
      row('Logradouro', d.endereco),
      row('Cidade', d.cidade),
      row('Área total', d.area_total_m2 ? `${d.area_total_m2} m²` : '—'),
      row('Descrição da obra', `${d.ocupacao ?? ''} (${d.divisao ?? ''})`),
      row('Responsável técnico', `${d.responsavel_tecnico ?? ''} ${d.crea_resp ?? ''}`)
    ]),
    h3('1. Acesso de viaturas na edificação e áreas de risco'),
    p(textoAcessoViaturas(d), { justify: true })
  ];
  if (av.largura_via_m || av.largura_portao_m || av.altura_portao_m) {
    out.push(tabela([
      row('Largura da via (m)', av.largura_via_m ?? '—'),
      row('Largura do portão (m)', av.largura_portao_m ?? '—'),
      row('Altura do portão (m)', av.altura_portao_m ?? '—')
    ]));
  }
  out.push(...assinatura(d));
  return out;
}

// ============================================================================
// Seção: Termo de saídas de emergência
// ============================================================================
function secTermoSaidas(d: any): any[] {
  return [
    h1('Termo de responsabilidade das saídas de emergência'),
    p(textoTermoSaidas(d), { justify: true }),
    p(
      'Assumo toda a responsabilidade civil e criminal quanto à permanência das portas em ' +
      'condições de uso imediato em caso de emergência.',
      { justify: true }
    ),
    ...assinatura(d)
  ];
}

// ============================================================================
// Função principal de geração
// ============================================================================
export async function gerarDocxBlob(d: any): Promise<Blob> {
  const children: any[] = [
    // PÁGINA 1 — OFÍCIO
    ...secOficio(d),
    pageBreak(),

    // PÁGINA 2 — CLASSIFICAÇÃO + MEDIDAS (mesmo tópico)
    ...secClassificacaoEMedidas(d),
    pageBreak(),

    // PÁGINA 3 — MEMORIAL BÁSICO DE CONSTRUÇÃO
    ...secMemorialConstrucao(d),
    pageBreak(),

    // PÁGINA 4 — INFORMAÇÕES OPERACIONAIS
    ...secInfoOperacional(d),
    pageBreak(),

    // PÁGINA 5 — SAÍDAS DE EMERGÊNCIA (NPT 011)
    h1('Memorial de saídas de emergência (NPT 011)'),
    ...renderSaidasDocx(d),
    pageBreak(),

    // PÁGINA 6 — CARGA DE INCÊNDIO
    ...secCargaIncendio(d),
    pageBreak(),

    // PÁGINA 7 — ACESSO A VIATURAS
    ...secAcessoViaturas(d),
    pageBreak(),

    // PÁGINA 8 — TERMO DE SAÍDAS
    ...secTermoSaidas(d)
  ];

  if (d.observacoes) {
    children.push(pageBreak());
    children.push(h('Observações'));
    children.push(p(d.observacoes));
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
