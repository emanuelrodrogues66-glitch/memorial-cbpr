// Gera o memorial em DOCX usando a lib `docx`.
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, PageBreak,
  ImageRun
} from 'docx';
import { dimensionarTodos, DATA_SAIDAS, type Pavimento, type DimPavimento } from './saidas-npt011';
import { calcularCaminhamento, textoCaminhamento } from './caminhamento-npt011';
import { limparNomeAmbiente } from './nome-ambiente';
import {
  MEDIDAS_QUADRO_PADRAO,
  medidasQuadroParaUF,
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
import { incluiSecao, type SecaoMemorial } from './secoes-memorial';
import {
  rotuloNormaSaidas,
  rotuloNormaBrigada,
  rotuloNormaCarga,
  rotuloCBM,
  rotuloConjuntoNormativo,
  siglaCBM,
  norma,
  nptOuIn,
  itemNorma,
  type UF
} from './cbmsc';

// Texto consolidado da ocupação (mista ou simples)
function ocupacaoTexto(d: any): string {
  if (d.ocupacao_resumo && String(d.ocupacao_resumo).trim()) return String(d.ocupacao_resumo);
  const oc = d.ocupacao ?? '';
  const div = d.divisao ?? '';
  return div ? `${oc} (${div})` : oc;
}

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
      children: [new TextRun({ text: `Projeto Técnico de Prevenção a Incêndios e Desastres — ${siglaCBM((d.uf || 'PR') as UF)}`, size: 18, color: '7A7974' })]
    }),
    p(`${local}${local ? ', ' : ''}${data}`),
    p('Ao'),
    p('Serviço de Prevenção Contra Incêndio e Pânico'),
    p(rotuloCBM((d.uf || 'PR') as UF)),
    p(`${d.cidade || '—'}-${d.uf || 'PR'}`),
    p('Ilustríssimos Senhores,'),
    p(
      `Em conformidade com o ${rotuloConjuntoNormativo((d.uf || 'PR') as UF)}, vimos por meio deste solicitar a análise e posterior aprovação ` +
      'do Projeto Técnico de Prevenção a Incêndios e Desastres referente à edificação descrita a seguir:',
      { justify: true }
    ),
    tabela([
      row('Obra', d.nome_obra),
      row('Proprietário', d.proprietario),
      row('CPF / CNPJ', d.cpf_cnpj),
      row('Inscrição Imobiliária', d.inscricao_imobiliaria),
      row('Endereço', d.endereco),
      row('Cidade / UF', `${d.cidade ?? ''} / ${d.uf ?? ''}`),
      row('Ocupação', ocupacaoTexto(d)),
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
  const linhasMedidas = medidasQuadroParaUF((d.uf || 'PR') as UF).map((m) => {
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
      row('CNAE principal', d.cnae),
      row('Atividade', d.descricao_atividade),
      row('Grupo / Ocupação', `${d.grupo ?? ''} • ${d.ocupacao ?? ''}`),
      row('Divisão', d.divisao),
      row('Ocupação consolidada', ocupacaoTexto(d)),
      ...((Array.isArray(d.cnaes) && d.cnaes.length > 1)
        ? d.cnaes.map((c: any, i: number) => row(`CNAE ${i + 1}`, `${c.cnae} • ${c.divisao} • ${c.descricao}`))
        : []),
      row('Carga de incêndio', d.carga_incendio_mj_m2 ? `${Number(d.carga_incendio_mj_m2).toFixed(2)} MJ/m²` : '—'),
      row('Risco', d.risco_incendio)
    ]),

    h('3. Classificação física'),
    tabela([
      row('Área do terreno', d.area_total_m2 ? `${d.area_total_m2} m²` : '—'),
      row('Área construída', d.area_construida_m2 ? `${d.area_construida_m2} m²` : '—'),
      row('Altura da edificação', d.altura_edificacao_m ? `${d.altura_edificacao_m} m` : '—'),
      row('Pavimentos', d.numero_pavimentos),
      row(`Tipo (${nptOuIn((d.uf || 'PR') as UF, '005')})`, d.tipo_edificacao),
      row(`Classe (${nptOuIn((d.uf || 'PR') as UF, '008')})`, d.classe_npt008),
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
      row('Ocupação', ocupacaoTexto(d))
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
      row('1.2 Ocupação', ocupacaoTexto(d)),
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

  // Bloco de caminhamento (Anexo B NPT 011) no topo
  const divisaoPrincipal = String(d.divisao || '').trim();
  const medidasCSCIP: any[] = Array.isArray(d.medidas_cscip) ? d.medidas_cscip : [];
  const temMedida = (chave: string) =>
    medidasCSCIP.some((m) => m?.status === 'EXIGIDO' && String(m?.descricao || '').toLowerCase().includes(chave));
  const blocoCaminhamento: any[] = [];
  if (divisaoPrincipal) {
    try {
      const camin = calcularCaminhamento({
        divisao_principal: divisaoPrincipal,
        com_sprinkler: temMedida('chuveiro'),
        com_deteccao_fumaca: temMedida('detec'),
        leiaute_apresentado: Boolean(d.leiaute_apresentado),
      });
      blocoCaminhamento.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [new TextRun({ text: `Caminhamento conforme ocupação principal (${divisaoPrincipal} — faixa ${camin.rotulo_faixa})`, bold: true, size: 18 })]
        })
      );
      blocoCaminhamento.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: textoCaminhamento(camin), size: 18 })] }));
    } catch {}
  }

  if (pavs.length === 0) {
    return [
      ...blocoCaminhamento,
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
  const out: any[] = [...blocoCaminhamento];

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
        cellText('Qtd.', { bold: true, bg: 'F2F2F2', align: AlignmentType.CENTER }),
        cellText('Critério', { bold: true, bg: 'F2F2F2', align: AlignmentType.CENTER }),
        cellText('População total', { bold: true, bg: 'F2F2F2', align: AlignmentType.CENTER })
      ]
    });
    const dataRows = dim.por_ambiente.map((a) => {
      const isDorm = a.unit === 'dorm';
      const netLabel = isDorm
        ? `${a.net} dorm.`
        : a.unit === 'vagas'
        ? `${a.net} vagas`
        : a.unit === 'assentos'
        ? `${a.net} assentos`
        : `${a.net.toFixed(2)} m²`;
      return new TableRow({
        children: [
          cellText(limparNomeAmbiente(a.nome)),
          cellText(a.divisao, { align: AlignmentType.CENTER }),
          cellText(netLabel, { align: AlignmentType.CENTER }),
          cellText(DATA_SAIDAS[a.divisao]?.pop ?? '—', { align: AlignmentType.CENTER }),
          cellText(`${a.pop} pessoas`, { align: AlignmentType.CENTER, bold: true })
        ]
      });
    });
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

    out.push(
      new Paragraph({
        spacing: { before: 160, after: 40 },
        children: [new TextRun({ text: `DIMENSIONAMENTO DAS UNIDADES DE PASSAGEM (${itemNorma((d.uf || 'PR') as UF, '011', '5.4').toUpperCase()})`, bold: true, size: 18, color: '01696F' })]
      })
    );
    out.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: `Fórmula: N = P / C, onde N = unidades de passagem; P = população do pavimento; C = capacidade da unidade de passagem (${(d.uf || 'PR') === 'SC' ? 'Tabela 7 da IN 09' : 'Tabela 5 da NPT 011'}). Resultado arredondado para o número inteiro imediatamente superior.`,
          italics: true, size: 16, color: '7A7974'
        })]
      })
    );
    for (const comp of dim.dimensionamento) {
      const nCalc = dim.populacao_total / Math.max(comp.c_critico, 1);
      const N = Math.max(1, Math.ceil(nCalc));
      const upFinal = comp.total_up;
      const larg = comp.total_largura_m.toFixed(2);
      out.push(
        new Paragraph({
          spacing: { before: 80, after: 30 },
          children: [new TextRun({ text: `${comp.label.toUpperCase()} — C = ${comp.c_critico} pessoas/UP`, bold: true, size: 18 })]
        })
      );
      out.push(new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: '    N = P / C', size: 18 })] }));
      out.push(new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `    N = ${dim.populacao_total} / ${comp.c_critico}`, size: 18 })] }));
      out.push(new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `    N = ${nCalc.toFixed(2)} → ${N} UP (arredondado p/ cima)`, size: 18 })] }));
      out.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: `    Total exigido: ${upFinal} UP × 0,55 m = ${larg} m (largura mínima absoluta: ${comp.min_largura.toFixed(2)} m)`, bold: true, size: 18 })]
        })
      );
    }

    if (dim.verificacao.length > 0) {
      out.push(
        new Paragraph({
          spacing: { before: 160, after: 40 },
          children: [new TextRun({ text: `CONFERÊNCIA DOS ELEMENTOS EXECUTADOS (${itemNorma((d.uf || 'PR') as UF, '011', '5.4.1').toUpperCase()})`, bold: true, size: 18, color: '01696F' })]
        })
      );
      out.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({
            text: 'Para cada componente real: UP = largura / 0,55 m, considerando apenas UPs inteiras (arredondamento para baixo). Quando há mais de um componente do mesmo tipo, as UPs são somadas.',
            italics: true, size: 16, color: '7A7974'
          })]
        })
      );
      const pav = pavs.find((pp) => pp.id === dim.pavimento_id);
      for (const v of dim.verificacao) {
        out.push(
          new Paragraph({
            spacing: { before: 80, after: 20 },
            children: [new TextRun({ text: v.label, bold: true, size: 18 })]
          })
        );
        const reais = ((pav && pav.saidas_reais) || []).filter((s) => s.tipo === v.tipo);
        if (reais.length === 0) {
          out.push(new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: '    Nenhum elemento informado.', size: 17, color: '7A7974', italics: true })] }));
        } else {
          reais.forEach((el, idx) => {
            const larg = Number(el.largura_m) || 0;
            const qtd = Number(el.quantidade) || 0;
            const upEl = Math.floor(larg / 0.55);
            const ident = el.identificacao || `${v.label} ${idx + 1}`;
            out.push(new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: `    ${ident} (${qtd} un):`, size: 17 })] }));
            out.push(new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: `        UP = ${larg.toFixed(2)} / 0,55 = ${(larg / 0.55).toFixed(2)} → ${upEl} UP cada`, size: 17 })] }));
            if (qtd > 1) {
              out.push(new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: `        Soma do tipo: ${upEl} × ${qtd} = ${upEl * qtd} UP`, size: 17 })] }));
            }
          });
        }
        out.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: v.acesso_restrito
                  ? `    ${v.atende ? 'ATENDE' : 'NÃO ATENDE'} — Acesso restrito (pop. < 10 pessoas) — largura mínima 0,80 m por elemento — NPT 011 item 5.3.1`
                  : `    ${v.atende ? 'ATENDE' : 'NÃO ATENDE'} — Total real: ${v.up_real} UP • Exigido: ${v.up_exigido} UP`,
                bold: true,
                size: 17,
                color: v.atende ? '437A22' : 'A12C7B'
              })
            ]
          })
        );
      }
    }

    // Consolidado do bloco (porta + escada + rampa + acesso)
    if (dim.verificacao_consolidada && dim.verificacao.length > 1) {
      const vc = dim.verificacao_consolidada;
      out.push(
        new Paragraph({
          spacing: { before: 160, after: 40 },
          children: [new TextRun({ text: 'VERIFICAÇÃO CONSOLIDADA DO BLOCO DE SAÍDA', bold: true, size: 18, color: '01696F' })]
        })
      );
      out.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({
            text: 'Quando o mesmo bloco de saída combina porta + escada + rampa + acesso, as unidades de passagem dos componentes são somadas e comparadas com o componente mais restritivo.',
            italics: true, size: 16, color: '7A7974'
          })]
        })
      );
      for (const c of vc.componentes) {
        out.push(new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: `    ${c.label}: ${c.up} UP (${c.quantidade} un)`, size: 17 })] }));
      }
      out.push(
        new Paragraph({
          spacing: { after: 10 },
          children: [new TextRun({ text: `    Total real consolidado: ${vc.componentes.map((c) => c.up).join(' + ')} = ${vc.up_real_total} UP`, size: 17 })]
        })
      );
      out.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({
            text: `    ${vc.atende ? 'ATENDE' : 'NÃO ATENDE'} — Consolidado ${vc.up_real_total} UP ≥ Exigido (mais restritivo) ${vc.up_exigido} UP`,
            bold: true, size: 17,
            color: vc.atende ? '437A22' : 'A12C7B'
          })]
        })
      );
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
      `A carga de incêndio adotada para o dimensionamento das medidas de segurança foi obtida ` +
      `diretamente da tabela da ${rotuloNormaCarga((d.uf || 'PR') as UF)}, conforme a ocupação principal da edificação.`,
      { justify: true }
    ));
    out.push(tabela([
      row('Ocupação principal', ocupacaoTexto(d)),
      row('Carga de incêndio adotada', `${Number(d.carga_incendio_mj_m2 || 0).toFixed(2)} MJ/m²`),
      row('Risco predominante', d.risco_incendio)
    ]));
    out.push(...assinatura(d));
    return out;
  }

  out.push(p(
    `A carga de incêndio total da edificação foi calculada pela média ponderada por área de cada setor ` +
    `de ocupação, conforme ${rotuloNormaCarga((d.uf || 'PR') as UF)}.`,
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
function figuraDocx(buf: ArrayBuffer | null, titulo: string, fonte: string): any[] {
  const out: any[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: [new TextRun({ text: titulo, size: 18 })]
    })
  ];
  if (buf) {
    out.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          data: buf,
          transformation: { width: 380, height: 260 },
          type: 'jpg'
        } as any)
      ]
    }));
  }
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
    children: [new TextRun({ text: fonte, size: 16, color: '7A7974', italics: true })]
  }));
  return out;
}

async function carregarImagemNpt006(arquivo: string): Promise<ArrayBuffer | null> {
  if (typeof window === 'undefined') return null;
  try {
    const url = window.location.origin + '/imagens-npt006/' + arquivo;
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.arrayBuffer();
  } catch {
    return null;
  }
}

async function secAcessoViaturas(d: any): Promise<any[]> {
  const av = d.acesso_viaturas || {};
  const out: any[] = [
    h1('Memorial descritivo — Acesso de viaturas'),
    tabela([
      row('Proprietário', d.proprietario),
      row('Logradouro', d.endereco),
      row('Cidade', d.cidade),
      row('Área total', d.area_total_m2 ? `${d.area_total_m2} m²` : '—'),
      row('Descrição da obra', ocupacaoTexto(d)),
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

  // Figuras NPT 006
  const [img1, img2, img3] = await Promise.all([
    carregarImagemNpt006('01-largura-via.jpg'),
    carregarImagemNpt006('02-portao-acesso.jpg'),
    carregarImagemNpt006('03-retorno-edificio.jpg')
  ]);
  out.push(...figuraDocx(
    img1,
    'Figura 1 — Largura de via de acesso.',
    `FONTE: ${norma((d.uf || 'PR') as UF, '006')} — Acesso de viatura na edificação e áreas de risco.`
  ));
  out.push(...figuraDocx(
    img2,
    'Figura 2 — Largura e altura mínima do portão de acesso.',
    `FONTE: ${norma((d.uf || 'PR') as UF, '006')} — Acesso de viatura na edificação e áreas de risco.`
  ));
  out.push(...figuraDocx(
    img3,
    'Figura 3 — Disposição das vias de acesso e retorno de viaturas.',
    `FONTE: ${norma((d.uf || 'PR') as UF, '006')} — Acesso de viatura na edificação e áreas de risco.`
  ));
  out.push(p(
    'Recomenda-se que as vias de acesso com extensão superior a 45,00 m possuam retornos em ' +
    `formato circular, em "Y" ou em "T", conforme modelos de retornos constantes na ${norma((d.uf || 'PR') as UF, '005')} — ` +
    'Segurança contra incêndio urbanística.',
    { justify: true }
  ));

  out.push(...assinatura(d));
  return out;
}

// ============================================================================
// Seção: Brigada de incêndio (NPT 017)
// ============================================================================
function secBrigada(d: any): any[] {
  const uf = (d.uf || 'PR') as UF;

  // SC: dimensionamento por IN-28 (GPF por divisão + isenção + nível de treinamento)
  if (uf === 'SC') {
    const brig = Number(d.brigadistas_necessarios) || 0;
    const popFixa = Number(d.brigada_populacao_fixa ?? d.populacao_fixa ?? d.populacao_calculada) || 0;
    const possuiSprinkler = Boolean(d.brigada_possui_sprinkler);
    const isento = Boolean(d.brigada_isento);
    const treino = d.brigada_treinamento || 'Básico';
    const out: any[] = [
      h1('Memorial de cálculo da brigada de incêndio (IN 28 do CBMSC)'),
      p(
        `Conforme a IN 28 do ${rotuloCBM(uf)}, a brigada de incêndio é dimensionada pelo ` +
        `Grupo de População Fixa (GPF) aplicável à divisão de ocupação (Anexo A, Tabela 3). ` +
        `O número de brigadistas é obtido por: brigadistas = teto (população fixa ÷ GPF). ` +
        `Os níveis de treinamento (Básico, Intermediário, Avançado, Misto) variam por divisão ` +
        `e por porte da edificação.`,
        { justify: true }
      ),
      h3('Dados de entrada'),
      tabela([
        row('Ocupação', ocupacaoTexto(d)),
        row('Divisão', d.divisao || d.grupo),
        row('Funcionários por turno (população fixa)', `${popFixa} pessoa(s)`),
        row('Chuveiros automáticos (sprinklers)', possuiSprinkler ? 'Sim — GPF acrescido em 5 (Nota 1, IN 28)' : 'Não')
      ]),
      h3('Resultado')
    ];
    if (isento) {
      out.push(p(
        'Conforme IN 28 do CBMSC, a edificação está dispensada da composição de brigada de ' +
        'incêndio em função do seu porte e da divisão de ocupação.',
        { justify: true }
      ));
    } else {
      out.push(p('Memória de cálculo: ' + (d.brigadistas_descricao || '')));
      out.push(tabela([
        row('Brigadistas orgânicos necessários', `${brig} brigadista(s)`),
        row('Mínimo absoluto', '3 brigadistas orgânicos (Art. 16 §2º, IN 28)'),
        row('Nível de treinamento', treino),
        row('Norma aplicável', rotuloNormaBrigada(uf))
      ]));
    }
    out.push(...assinatura(d));
    return out;
  }

  // PR (default): mantém cálculo NPT 017 existente
  const grupo = (d.grupo || '').toString().toUpperCase().trim();
  const isF = grupo.startsWith('F');
  const popOriginal = Number(d.populacao_calculada) || 0;
  const popAjustada = Number(d.brigada_populacao_ajustada) || popOriginal;
  const brig = Number(d.brigadistas_necessarios) || 0;
  return [
    h1(`Memorial de cálculo da brigada de incêndio (${rotuloNormaBrigada('PR')})`),
    p(
      `Item 6.2 da ${rotuloNormaBrigada('PR')}: a composição da brigada de incêndio será determinada pela população ` +
      `potencialmente exposta, conforme Tabela 1 da ${rotuloNormaSaidas('PR')}, na proporção de 1 brigadista orgânico ` +
      'para cada 200 (duzentas) pessoas, considerando-se o número inteiro imediatamente superior.',
      { justify: true }
    ),
    p(
      isF
        ? 'Quando se tratar do Grupo F (locais de reunião de público), a população considerada será ' +
          'acrescida em 30% antes da divisão por 200.'
        : 'A ocupação não pertence ao Grupo F; portanto não se aplica o acréscimo de 30% sobre a população.',
      { justify: true }
    ),
    h3('Dados de entrada'),
    tabela([
      row('Ocupação', ocupacaoTexto(d)),
      row('Grupo', d.grupo),
      row('População potencialmente exposta', `${popOriginal} pessoa(s)`),
      row('Acréscimo Grupo F (30%)', isF ? 'Sim' : 'Não'),
      row('População considerada', `${popAjustada} pessoa(s)`)
    ]),
    h3('Cálculo'),
    p(
      isF
        ? `${popOriginal} × 1,30 = ${popAjustada} pessoa(s) → ${popAjustada} ÷ 200 = ${(popAjustada / 200).toFixed(2)} ` +
          `→ ${brig} brigadista(s).`
        : `${popAjustada} ÷ 200 = ${(popAjustada / 200).toFixed(2)} → ${brig} brigadista(s).`,
      { justify: true }
    ),
    tabela([
      row('Resultado', `${brig} brigadista(s) treinado(s)`),
      row(`Critério ${rotuloNormaBrigada('PR')}`, '1 brigadista a cada 200 pessoas (arredondamento para cima)')
    ]),
    p('Nota: com base no cálculo foi considerado 1 brigadista a cada 200 pessoas.', { italic: true }),
    ...assinatura(d)
  ];
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
export async function gerarDocxBlob(d: any, secoes?: SecaoMemorial[]): Promise<Blob> {
  const children: any[] = [];
  const blocos: { key: SecaoMemorial; els: any[] }[] = [];

  if (incluiSecao(secoes, 'oficio')) blocos.push({ key: 'oficio', els: secOficio(d) });
  if (incluiSecao(secoes, 'classificacao')) blocos.push({ key: 'classificacao', els: secClassificacaoEMedidas(d) });
  if (incluiSecao(secoes, 'memorial_construcao')) blocos.push({ key: 'memorial_construcao', els: secMemorialConstrucao(d) });
  if (incluiSecao(secoes, 'inf_operacional')) blocos.push({ key: 'inf_operacional', els: secInfoOperacional(d) });
  if (incluiSecao(secoes, 'saidas')) {
    blocos.push({
      key: 'saidas',
      els: [h1(`Memorial de saídas de emergência (${rotuloNormaSaidas((d.uf || 'PR') as UF)})`), ...renderSaidasDocx(d), ...assinatura(d)]
    });
  }
  if (incluiSecao(secoes, 'carga_incendio')) blocos.push({ key: 'carga_incendio', els: secCargaIncendio(d) });
  if (incluiSecao(secoes, 'brigada')) blocos.push({ key: 'brigada', els: secBrigada(d) });
  if (incluiSecao(secoes, 'acesso_viaturas')) blocos.push({ key: 'acesso_viaturas', els: await secAcessoViaturas(d) });
  if (incluiSecao(secoes, 'termo_saidas')) blocos.push({ key: 'termo_saidas', els: secTermoSaidas(d) });

  blocos.forEach((b, i) => {
    children.push(...b.els);
    if (i < blocos.length - 1) children.push(pageBreak());
  });

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
