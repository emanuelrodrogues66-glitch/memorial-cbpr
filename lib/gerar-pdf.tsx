// PDF do Memorial Descritivo CBPR via @react-pdf/renderer
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import React from 'react';
import { getMedidasCSCIP } from './cscip-medidas';
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

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#28251D' },
  h1: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  h2: { fontSize: 12, fontWeight: 'bold', marginTop: 14, marginBottom: 6, color: '#01696F' },
  h3: { fontSize: 10, fontWeight: 'bold', marginTop: 8, marginBottom: 4, color: '#28251D' },
  p: { lineHeight: 1.5, marginBottom: 4 },
  pJustify: { lineHeight: 1.5, marginBottom: 6, textAlign: 'justify' },
  row: { flexDirection: 'row', borderBottom: '1px solid #D4D1CA', paddingVertical: 3 },
  rowKey: { width: '38%', color: '#7A7974', fontSize: 9 },
  rowVal: { width: '62%', fontWeight: 'bold', fontSize: 9 },
  bullets: { paddingLeft: 12 },
  small: { fontSize: 8, color: '#7A7974', marginTop: 4 },
  tableHead: {
    flexDirection: 'row', backgroundColor: '#F9F8F5', borderBottom: '1px solid #D4D1CA',
    padding: 3, fontWeight: 'bold', fontSize: 8
  },
  tableRow: { flexDirection: 'row', borderBottom: '0.5px solid #E5E3DD', padding: 3, fontSize: 8 },
  tableTotal: {
    flexDirection: 'row', borderTop: '1px solid #28251D', padding: 3,
    fontWeight: 'bold', fontSize: 8
  },
  cellL: { width: '34%' },
  cellR: { width: '11%', textAlign: 'right' },
  cellRWide: { width: '12%', textAlign: 'right' },
  badge: { padding: 2, borderRadius: 2, fontSize: 7, fontWeight: 'bold', color: '#FFFFFF' },
  badgeOk: { backgroundColor: '#437A22' },
  badgeFail: { backgroundColor: '#A12C7B' },
  capa: { marginTop: 24, marginBottom: 18, textAlign: 'center' },
  // Quadro de medidas (3 colunas)
  qmRow: { flexDirection: 'row', borderBottom: '0.5px solid #D4D1CA', minHeight: 16 },
  qmHead: {
    flexDirection: 'row', backgroundColor: '#01696F', color: '#FFFFFF', padding: 3,
    fontWeight: 'bold', fontSize: 8
  },
  qmCellNome: { width: '55%', padding: 3, fontSize: 8 },
  qmCellNorma: { width: '32%', padding: 3, fontSize: 8 },
  qmCellSim: { width: '13%', padding: 3, fontSize: 8, textAlign: 'center', fontWeight: 'bold' },
  // Assinatura padrão
  assinaturaBox: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 },
  assinaturaCol: { width: '47%', textAlign: 'center', fontSize: 8 },
  linha: { borderTop: '1px solid #28251D', paddingTop: 3 }
});

function Linha({ k, v }: { k: string; v: any }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowKey}>{k}</Text>
      <Text style={styles.rowVal}>{v == null || v === '' ? '—' : String(v)}</Text>
    </View>
  );
}

function Assinatura({ d, local }: { d: any; local?: string }) {
  const localizacao = local || d.oficio_local || d.cidade || '';
  const dataFmt = formatarData(d.oficio_data) || formatarData(new Date().toISOString());
  return (
    <>
      <Text style={[styles.small, { marginTop: 18, textAlign: 'center' }]}>
        {localizacao}{localizacao ? ', ' : ''}{dataFmt}
      </Text>
      <View style={styles.assinaturaBox}>
        <View style={styles.assinaturaCol}>
          <Text style={styles.linha}>{d.responsavel_tecnico || 'Responsável técnico'}</Text>
          <Text>CREA / CAU: {d.crea_resp || '—'}</Text>
        </View>
        <View style={styles.assinaturaCol}>
          <Text style={styles.linha}>{d.proprietario || 'Proprietário'}</Text>
          <Text>CPF/CNPJ: {d.cpf_cnpj || '—'}</Text>
        </View>
      </View>
    </>
  );
}

export function MemorialPdf({ d }: { d: any }) {
  return (
    <Document>
      {/* PÁGINA 1 — OFÍCIO DE APRESENTAÇÃO */}
      <Page size="A4" style={styles.page}>
        <View style={styles.capa}>
          <Text style={styles.h1}>OFÍCIO DE APRESENTAÇÃO DO PTPID</Text>
          <Text style={styles.small}>
            Projeto Técnico de Prevenção a Incêndios e Desastres — CBMPR
          </Text>
        </View>

        <Text style={[styles.p, { marginTop: 16 }]}>
          {(d.oficio_local || d.cidade) ? `${d.oficio_local || d.cidade}, ` : ''}
          {formatarData(d.oficio_data) || formatarData(new Date().toISOString())}
        </Text>

        <Text style={[styles.p, { marginTop: 12 }]}>Ao</Text>
        <Text style={styles.p}>Serviço de Prevenção Contra Incêndio e Pânico</Text>
        <Text style={styles.p}>Corpo de Bombeiros Militar do Paraná</Text>
        <Text style={styles.p}>{d.cidade || '—'}-{d.uf || 'PR'}</Text>

        <Text style={[styles.p, { marginTop: 12 }]}>Ilustríssimos Senhores,</Text>

        <Text style={[styles.pJustify, { marginTop: 8 }]}>
          Em conformidade com o CSCIP-CBMPR, vimos por meio deste solicitar a análise
          e posterior aprovação do Projeto Técnico de Prevenção a Incêndios e Desastres
          referente à edificação descrita a seguir:
        </Text>

        <View style={{ marginTop: 8 }}>
          <Linha k="Obra" v={d.nome_obra} />
          <Linha k="Proprietário" v={d.proprietario} />
          <Linha k="CPF / CNPJ" v={d.cpf_cnpj} />
          <Linha k="Endereço" v={d.endereco} />
          <Linha k="Cidade / UF" v={`${d.cidade ?? ''} / ${d.uf ?? ''}`} />
          <Linha k="Ocupação" v={`${d.ocupacao ?? ''} (${d.divisao ?? ''})`} />
          <Linha k="Área total" v={d.area_total_m2 ? `${d.area_total_m2} m²` : '—'} />
          <Linha k="Área construída" v={d.area_construida_m2 ? `${d.area_construida_m2} m²` : '—'} />
        </View>

        <Text style={[styles.pJustify, { marginTop: 12 }]}>
          Restrito ao exposto, antecipadamente agradecemos.
        </Text>
        <Text style={styles.p}>Atenciosamente,</Text>

        <Assinatura d={d} />
      </Page>

      {/* PÁGINA 2 — CLASSIFICAÇÃO GERAL + FÍSICA + QUADRO DE MEDIDAS (mesmo tópico) */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Classificação da edificação e medidas de segurança</Text>
        <Text style={styles.small}>
          Apresentação consolidada da classificação geral, classificação física e quadro
          resumo das medidas de segurança contra incêndio exigidas (ANEXO F).
        </Text>

        <Text style={styles.h2}>1. Dados da obra</Text>
        <Linha k="Nome da obra" v={d.nome_obra} />
        <Linha k="Proprietário" v={d.proprietario} />
        <Linha k="CPF / CNPJ" v={d.cpf_cnpj} />
        <Linha k="Endereço" v={d.endereco} />
        <Linha k="Cidade / UF" v={`${d.cidade ?? ''} / ${d.uf ?? ''}`} />

        <Text style={styles.h2}>2. Classificação geral (CNAE / CSCIP)</Text>
        <Linha k="CNAE" v={d.cnae} />
        <Linha k="Atividade" v={d.descricao_atividade} />
        <Linha k="Grupo / Ocupação" v={`${d.grupo} • ${d.ocupacao}`} />
        <Linha k="Divisão" v={d.divisao} />
        <Linha k="Carga de incêndio" v={d.carga_incendio_mj_m2 ? `${Number(d.carga_incendio_mj_m2).toFixed(2)} MJ/m²` : '—'} />
        <Linha k="Risco" v={d.risco_incendio} />

        <Text style={styles.h2}>3. Classificação física</Text>
        <Linha k="Área do terreno" v={d.area_total_m2 ? `${d.area_total_m2} m²` : '—'} />
        <Linha k="Área construída" v={d.area_construida_m2 ? `${d.area_construida_m2} m²` : '—'} />
        <Linha k="Altura da edificação" v={d.altura_edificacao_m ? `${d.altura_edificacao_m} m` : '—'} />
        <Linha k="Pavimentos" v={d.numero_pavimentos} />
        <Linha k="Tipo (NPT 005)" v={d.tipo_edificacao} />
        <Linha k="Classe (NPT 008)" v={d.classe_npt008} />
        <Linha k="TRRF" v={d.trrf_minutos != null ? `${d.trrf_minutos} min` : 'sem regra'} />

        <Text style={styles.h2}>4. Quadro resumo das medidas de segurança</Text>
        <View style={styles.qmHead}>
          <Text style={styles.qmCellNome}>MEDIDA DE SEGURANÇA</Text>
          <Text style={styles.qmCellNorma}>NORMA APLICÁVEL</Text>
          <Text style={styles.qmCellSim}>EXIGIDA</Text>
        </View>
        {MEDIDAS_QUADRO_PADRAO.map((m) => {
          const exigida = medidaAtende(d, m.nome);
          return (
            <View key={m.nome} style={styles.qmRow}>
              <Text style={styles.qmCellNome}>{m.nome}</Text>
              <Text style={styles.qmCellNorma}>
                {exigida ? m.norma : 'NÃO SE APLICA'}
              </Text>
              <Text style={[styles.qmCellSim, { color: exigida ? '#437A22' : '#A12C7B' }]}>
                {exigida ? 'SIM' : 'NÃO'}
              </Text>
            </View>
          );
        })}
      </Page>

      {/* PÁGINA 3 — MEMORIAL BÁSICO DE CONSTRUÇÃO */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Memorial básico de construção</Text>
        <Linha k="Endereço" v={d.endereco} />
        <Linha k="Município" v={`${d.cidade ?? ''}-${d.uf ?? ''}`} />
        <Linha k="Proprietário" v={d.proprietario} />
        <Linha k="Obra" v={d.nome_obra} />
        <Linha k="Ocupação" v={`${d.ocupacao ?? ''} (${d.divisao ?? ''})`} />

        <Text style={styles.h3}>1. ESTRUTURAS</Text>
        <Text style={styles.pJustify}>{textoEstruturas(d)}</Text>

        <Text style={styles.h3}>2. ALVENARIAS</Text>
        <Text style={styles.pJustify}>{textoAlvenarias(d)}</Text>

        <Text style={styles.h3}>3. COMPARTIMENTAÇÕES</Text>
        <Text style={styles.pJustify}>{textoCompartimentacoes(d)}</Text>

        <Text style={styles.h3}>4. COMPARTIMENTOS</Text>
        <Text style={styles.pJustify}>{textoCompartimentos(d)}</Text>

        <Text style={styles.h3}>5. INSTALAÇÕES</Text>
        <Text style={styles.pJustify}>{textoInstalacoes(d)}</Text>

        <Text style={styles.h3}>6. VIDROS</Text>
        <Text style={styles.pJustify}>{textoVidros(d)}</Text>

        <Text style={styles.h3}>7. MEDIDAS DE SEGURANÇA CONTRA INCÊNDIO</Text>
        <Text style={styles.pJustify}>{textoMedidasSeguranca(d)}</Text>

        <Assinatura d={d} />
      </Page>

      {/* PÁGINA 4 — PLANILHA DE INFORMAÇÕES OPERACIONAIS */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Planilha de informações operacionais</Text>
        {renderInfoOperacional(d)}
        <Assinatura d={d} />
      </Page>

      {/* PÁGINA 5 — MEMORIAL DE SAÍDAS (NPT 011) */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Memorial de saídas de emergência (NPT 011)</Text>
        {renderSaidasPdf(d)}
      </Page>

      {/* PÁGINA 6 — MEMORIAL DE CÁLCULO DA CARGA DE INCÊNDIO */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Memorial de cálculo de carga de incêndio</Text>
        {renderCargaIncendio(d)}
        <Assinatura d={d} />
      </Page>

      {/* PÁGINA 7 — ACESSO A VIATURAS (NPT 006) */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Memorial descritivo — Acesso de viaturas</Text>
        <Linha k="Proprietário" v={d.proprietario} />
        <Linha k="Logradouro" v={d.endereco} />
        <Linha k="Cidade" v={d.cidade} />
        <Linha k="Área total" v={d.area_total_m2 ? `${d.area_total_m2} m²` : '—'} />
        <Linha k="Descrição da obra" v={`${d.ocupacao ?? ''} (${d.divisao ?? ''})`} />
        <Linha k="Responsável técnico" v={`${d.responsavel_tecnico ?? ''} ${d.crea_resp ?? ''}`} />

        <Text style={styles.h2}>1. Acesso de viaturas na edificação e áreas de risco</Text>
        <Text style={styles.pJustify}>{textoAcessoViaturas(d)}</Text>

        {d.acesso_viaturas && (d.acesso_viaturas.largura_via_m || d.acesso_viaturas.largura_portao_m) ? (
          <View style={{ marginTop: 8 }}>
            <Linha k="Largura da via (m)" v={d.acesso_viaturas.largura_via_m ?? '—'} />
            <Linha k="Largura do portão (m)" v={d.acesso_viaturas.largura_portao_m ?? '—'} />
            <Linha k="Altura do portão (m)" v={d.acesso_viaturas.altura_portao_m ?? '—'} />
          </View>
        ) : null}

        <Assinatura d={d} />
      </Page>

      {/* PÁGINA 8 — TERMO DE RESPONSABILIDADE DAS SAÍDAS DE EMERGÊNCIA */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Termo de responsabilidade das saídas de emergência</Text>
        <Text style={[styles.pJustify, { marginTop: 18 }]}>{textoTermoSaidas(d)}</Text>
        <Text style={[styles.pJustify, { marginTop: 8 }]}>
          Assumo toda a responsabilidade civil e criminal quanto à permanência das portas
          em condições de uso imediato em caso de emergência.
        </Text>
        <Assinatura d={d} />
      </Page>
    </Document>
  );
}

// ============================================================================
// Render: planilha de informações operacionais
// ============================================================================
function renderInfoOperacional(d: any) {
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

  return (
    <>
      <Text style={styles.h3}>1. Informações gerais</Text>
      <Linha k="1.1 Localização" v={d.endereco} />
      <Linha k="1.2 Ocupação" v={`${d.ocupacao ?? ''} (${d.divisao ?? ''})`} />
      <Linha k="1.3 Área" v={d.area_construida_m2 ? `${d.area_construida_m2} m²` : '—'} />
      <Linha k="1.4 Construção" v={io.tipo_estrutura || d.descricao_atividade} />
      <Linha k="1.4.2 Acabamento das paredes" v={io.acabamento_paredes} />
      <Linha k="1.4.3 Acabamento dos pisos" v={io.acabamento_pisos} />
      <Linha k="1.4.4 Cobertura" v={io.cobertura} />
      <Linha k="1.5 População fixa" v={io.populacao_fixa || d.populacao_calculada} />
      <Linha k="1.5.1 População flutuante" v={io.populacao_flutuante} />
      <Linha k="1.5.3 Ponto de encontro" v={io.ponto_encontro} />
      <Linha k="1.6 Características" v={io.caracteristicas_funcionamento} />
      <Linha k="1.6.2 Horário de funcionamento" v={io.horario_funcionamento} />
      <Linha k="1.6.3 Vias de acesso" v={io.vias_acesso || d.endereco} />

      <Text style={styles.h3}>2. Recursos humanos</Text>
      <Linha k="2.1 Brigadistas por turno" v={io.numero_brigadistas || d.brigadistas_necessarios} />
      <Linha k="2.2 Brigadista profissional" v={io.brigadista_profissional} />
      <Linha k="2.3 Encarregado da segurança" v={io.encarregado_seguranca} />
      <Linha k="2.4 Telefone de emergência" v={io.telefone_emergencia || d.telefone} />

      <Text style={styles.h3}>3. Sistemas instalados</Text>
      {sistemasNomes.map((nome) => (
        <Linha key={nome} k={nome} v={sis[nome] || '—'} />
      ))}
      <Linha k="Reservatório — consumo (m³)" v={io.reserva_consumo} />
      <Linha k="Reservatório — RTI (m³)" v={io.reserva_rti} />
      <Linha k="Reservatório — total (m³)" v={io.reserva_total} />

      <Text style={styles.h3}>4. Posto de bombeiros mais próximo</Text>
      <Text style={styles.p}>{io.posto_bombeiros || '—'}</Text>

      <Text style={styles.h3}>5. Riscos especiais</Text>
      {riscosNomes.map((nome) => (
        <Linha key={nome} k={nome} v={risc[nome] || '—'} />
      ))}
      <Linha k="Outros riscos" v={io.outros_riscos} />
      <Linha k="Outras informações úteis" v={io.outras_informacoes} />
    </>
  );
}

// ============================================================================
// Render: memorial de carga de incêndio
// ============================================================================
function renderCargaIncendio(d: any) {
  const mem = d.carga_incendio_memorial || { itens: [], area_total: 0, ci_total_mj: 0, media_ponderada_mj_m2: 0 };
  const itens = Array.isArray(d.carga_incendio_itens) ? d.carga_incendio_itens : (mem.itens ?? []);

  if (!itens || itens.length === 0) {
    return (
      <View>
        <Text style={styles.pJustify}>
          A carga de incêndio adotada para o dimensionamento das medidas de segurança
          foi obtida diretamente da tabela do CSCIP (Anexo A da NPT 014), conforme a
          ocupação principal da edificação.
        </Text>
        <View style={{ marginTop: 8 }}>
          <Linha k="Ocupação principal" v={`${d.ocupacao ?? ''} (${d.divisao ?? ''})`} />
          <Linha k="Carga de incêndio adotada" v={`${Number(d.carga_incendio_mj_m2 || 0).toFixed(2)} MJ/m²`} />
          <Linha k="Risco predominante" v={d.risco_incendio} />
        </View>
      </View>
    );
  }

  return (
    <>
      <Text style={styles.pJustify}>
        A carga de incêndio total da edificação foi calculada pela média ponderada
        por área de cada setor de ocupação, conforme NPT 014 e Anexo A do CSCIP/PR.
        Cada setor contribui para o cálculo com a sua carga de incêndio específica
        multiplicada pela respectiva área.
      </Text>

      <View style={[styles.tableHead, { marginTop: 8 }]}>
        <Text style={{ width: '18%' }}>Pavto / Setor</Text>
        <Text style={{ width: '32%' }}>Ocupação</Text>
        <Text style={{ width: '12%' }}>Divisão</Text>
        <Text style={{ width: '13%', textAlign: 'right' }}>C.I (MJ/m²)</Text>
        <Text style={{ width: '11%', textAlign: 'right' }}>Área (m²)</Text>
        <Text style={{ width: '14%', textAlign: 'right' }}>C.I total</Text>
      </View>
      {itens.map((it: any, i: number) => {
        const ci = Number(it.ci_mj_m2) || 0;
        const a = Number(it.area_m2) || 0;
        return (
          <View key={it.id || i} style={styles.tableRow}>
            <Text style={{ width: '18%' }}>{it.pavimento_setor}</Text>
            <Text style={{ width: '32%' }}>{it.ocupacao_descricao}</Text>
            <Text style={{ width: '12%' }}>{it.divisao}</Text>
            <Text style={{ width: '13%', textAlign: 'right' }}>{ci.toFixed(2)}</Text>
            <Text style={{ width: '11%', textAlign: 'right' }}>{a.toFixed(2)}</Text>
            <Text style={{ width: '14%', textAlign: 'right' }}>{(ci * a).toFixed(2)}</Text>
          </View>
        );
      })}
      <View style={styles.tableTotal}>
        <Text style={{ width: '62%' }}>ÁREA TOTAL / CARGA ACUMULADA</Text>
        <Text style={{ width: '13%', textAlign: 'right' }}></Text>
        <Text style={{ width: '11%', textAlign: 'right' }}>{mem.area_total.toFixed(2)}</Text>
        <Text style={{ width: '14%', textAlign: 'right' }}>{mem.ci_total_mj.toFixed(2)}</Text>
      </View>
      <View style={[styles.tableTotal, { backgroundColor: '#D5E3D0' }]}>
        <Text style={{ width: '62%' }}>MÉDIA PONDERADA — Carga de incêndio</Text>
        <Text style={{ width: '38%', textAlign: 'right' }}>
          {mem.media_ponderada_mj_m2.toFixed(2)} MJ/m²
        </Text>
      </View>

      <View style={{ marginTop: 12 }}>
        <Linha k="Risco predominante" v={d.risco_incendio} />
        <Linha k="Critério" v={
          mem.media_ponderada_mj_m2 <= 300 ? 'BAIXO (≤ 300 MJ/m²)' :
          mem.media_ponderada_mj_m2 <= 1200 ? 'MÉDIO (300 < CI ≤ 1200 MJ/m²)' :
          'ALTO (> 1200 MJ/m²)'
        } />
      </View>
    </>
  );
}

// ============================================================================
// Render: saídas (NPT 011)
// ============================================================================
function renderSaidasPdf(d: any) {
  const pavs: Pavimento[] = Array.isArray(d.saidas_pavimentos) ? d.saidas_pavimentos : [];
  if (pavs.length === 0) {
    return (
      <>
        <Linha k="População" v={d.populacao_calculada} />
        <Linha k="Critério" v={d.populacao_descricao_npt011} />
        <Linha k="Unid. passagem — acesso/descarga" v={d.unidades_passagem_acesso} />
        <Linha k="Unid. passagem — escada" v={d.unidades_passagem_escada} />
        <Linha k="Unid. passagem — porta" v={d.unidades_passagem_porta} />
      </>
    );
  }
  const dims: DimPavimento[] = dimensionarTodos(pavs);
  return (
    <>
      {dims.map((dim) => (
        <View key={dim.pavimento_id} wrap={false} style={{ marginBottom: 10 }}>
          <Text style={styles.h3}>{dim.label}</Text>

          <View style={styles.tableHead}>
            <Text style={styles.cellL}>Ambiente</Text>
            <Text style={[styles.cellR, { width: '22%' }]}>Ocupação</Text>
            <Text style={styles.cellR}>Área (m²)</Text>
            <Text style={[styles.cellR, { width: '22%' }]}>População/m²</Text>
            <Text style={styles.cellR}>Pop. total</Text>
          </View>
          {dim.por_ambiente.map((a) => (
            <View key={a.id} style={styles.tableRow}>
              <Text style={styles.cellL}>{a.nome}</Text>
              <Text style={[styles.cellR, { width: '22%' }]}>{a.divisao}</Text>
              <Text style={styles.cellR}>{a.net.toFixed(2)}</Text>
              <Text style={[styles.cellR, { width: '22%' }]}>{popDesc(a.divisao)}</Text>
              <Text style={styles.cellR}>{a.pop} pess.</Text>
            </View>
          ))}
          <View style={styles.tableTotal}>
            <Text style={styles.cellL}>População total do pavimento</Text>
            <Text style={[styles.cellR, { width: '22%' }]}></Text>
            <Text style={styles.cellR}></Text>
            <Text style={[styles.cellR, { width: '22%' }]}></Text>
            <Text style={styles.cellR}>{dim.populacao_total} pess.</Text>
          </View>

          {dim.dimensionamento.map((comp) => (
            <View key={comp.mode} style={{ marginTop: 6 }}>
              <Text style={[styles.small, { fontWeight: 'bold', color: '#28251D' }]}>
                {comp.label} — C={comp.c_critico} • N=P/C={Math.ceil(dim.populacao_total / Math.max(comp.c_critico, 1))} UP
              </Text>
              <Text style={styles.small}>
                Total: {comp.total_up} UP × 0,55 m = {comp.total_largura_m.toFixed(2)} m (mínimo {comp.min_largura.toFixed(2)} m)
              </Text>
            </View>
          ))}

          {dim.verificacao.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.small, { fontWeight: 'bold', color: '#28251D' }]}>
                Verificação das saídas existentes
              </Text>
              {dim.verificacao.map((v) => (
                <View key={v.tipo} style={{ marginTop: 3 }}>
                  <Text style={styles.small}>
                    <Text style={[styles.badge, v.atende ? styles.badgeOk : styles.badgeFail]}>
                      {' '}{v.atende ? 'ATENDE' : 'NÃO ATENDE'}{' '}
                    </Text>{' '}
                    {v.label} — Exigido: {v.up_exigido} UP / {v.largura_exigida_m.toFixed(2)} m •
                    Real: {v.up_real} UP / {v.largura_real_m.toFixed(2)} m ({v.quantidade_elementos} un)
                  </Text>
                  {v.detalhes && v.detalhes !== 'Nenhum elemento informado' && (
                    <Text style={[styles.small, { paddingLeft: 10 }]}>{v.detalhes}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
      {dims.length > 1 && (
        <View style={{ marginTop: 6 }}>
          <Text style={[styles.small, { fontWeight: 'bold' }]}>
            População total (todos os pavimentos): {dims.reduce((s, d) => s + d.populacao_total, 0)} pessoas
          </Text>
        </View>
      )}
      <Text style={styles.small}>
        UP = 0,55 m | Largura mínima: porta 0,80 m, escada/acesso 1,20 m | Total agrupado usa C mais
        restritivo (item 5.3.2.2 NPT 011).
      </Text>
    </>
  );
}

function popDesc(divisao: string): string {
  return DATA_SAIDAS[divisao]?.pop ?? '—';
}

export async function gerarPdfBlob(d: any): Promise<Blob> {
  return await pdf(<MemorialPdf d={d} />).toBlob();
}
