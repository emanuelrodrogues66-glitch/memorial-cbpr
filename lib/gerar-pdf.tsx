// PDF do Memorial Descritivo CBPR via @react-pdf/renderer
import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer';
import { limparNomeAmbiente } from './nome-ambiente';
import React from 'react';
import { getMedidasCSCIP } from './cscip-medidas';
import { dimensionarTodos, DATA_SAIDAS, type Pavimento, type DimPavimento } from './saidas-npt011';
import { calcularCaminhamento, textoCaminhamento } from './caminhamento-npt011';
import {
  MEDIDAS_QUADRO_PADRAO,
  medidasQuadroParaUF,
  medidaAtende,
  palavraChaveQuadro,
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
  rotuloNormaIluminacao,
  rotuloNormaCarga,
  rotuloCBM,
  rotuloConjuntoNormativo,
  siglaCBM,
  norma,
  nptOuIn,
  itemNorma,
  type UF
} from './cbmsc';

function ocupacaoTexto(d: any): string {
  if (d.ocupacao_resumo && String(d.ocupacao_resumo).trim()) return String(d.ocupacao_resumo);
  const oc = d.ocupacao ?? '';
  const div = d.divisao ?? '';
  return div ? `${oc} (${div})` : oc;
}

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
  linha: { borderTop: '1px solid #28251D', paddingTop: 3 },
  // Figuras NPT 006
  figuraBox: { alignItems: 'center', marginTop: 10, marginBottom: 6 },
  figuraTitulo: { fontSize: 9, textAlign: 'center', marginBottom: 4 },
  figuraFonte: { fontSize: 8, textAlign: 'center', color: '#7A7974', marginTop: 4 },
  figuraImg: { maxWidth: 380, maxHeight: 280, objectFit: 'contain' }
});

// Resolve URL absoluta para imagens públicas (necessário no browser para @react-pdf/renderer)
function imgUrl(path: string): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin + path;
  }
  return path;
}

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

// ============================================================================
// PÁGINAS modulares (cada uma retorna <Page> ou null)
// ============================================================================

function PageOficio({ d }: { d: any }) {
  return (
    <Page size="A4" style={styles.page}>
        <View style={styles.capa}>
          <Text style={styles.h1}>OFÍCIO DE APRESENTAÇÃO DO PTPID</Text>
          <Text style={styles.small}>
            Projeto Técnico de Prevenção a Incêndios e Desastres — {siglaCBM((d.uf || 'PR') as UF)}
          </Text>
        </View>

        <Text style={[styles.p, { marginTop: 16 }]}>
          {(d.oficio_local || d.cidade) ? `${d.oficio_local || d.cidade}, ` : ''}
          {formatarData(d.oficio_data) || formatarData(new Date().toISOString())}
        </Text>

        <Text style={[styles.p, { marginTop: 12 }]}>Ao</Text>
        <Text style={styles.p}>Serviço de Prevenção Contra Incêndio e Pânico</Text>
        <Text style={styles.p}>{rotuloCBM((d.uf || 'PR') as UF)}</Text>
        <Text style={styles.p}>{d.cidade || '—'}-{d.uf || 'PR'}</Text>

        <Text style={[styles.p, { marginTop: 12 }]}>Ilustríssimos Senhores,</Text>

        <Text style={[styles.pJustify, { marginTop: 8 }]}>
          Em conformidade com o {rotuloConjuntoNormativo((d.uf || 'PR') as UF)}, vimos por meio deste solicitar a análise
          e posterior aprovação do Projeto Técnico de Prevenção a Incêndios e Desastres
          referente à edificação descrita a seguir:
        </Text>

        <View style={{ marginTop: 8 }}>
          <Linha k="Obra" v={d.nome_obra} />
          <Linha k="Proprietário" v={d.proprietario} />
          <Linha k="CPF / CNPJ" v={d.cpf_cnpj} />
          <Linha k="Inscrição Imobiliária" v={d.inscricao_imobiliaria} />
          <Linha k="Endereço" v={d.endereco} />
          <Linha k="Cidade / UF" v={`${d.cidade ?? ''} / ${d.uf ?? ''}`} />
          <Linha k="Ocupação" v={ocupacaoTexto(d)} />
          <Linha k="Área total" v={d.area_total_m2 ? `${d.area_total_m2} m²` : '—'} />
          <Linha k="Área construída" v={d.area_construida_m2 ? `${d.area_construida_m2} m²` : '—'} />
        </View>

        <Text style={[styles.pJustify, { marginTop: 12 }]}>
          Restrito ao exposto, antecipadamente agradecemos.
        </Text>
        <Text style={styles.p}>Atenciosamente,</Text>

        <Assinatura d={d} />
      </Page>
  );
}

function PageClassificacao({ d }: { d: any }) {
  const cnaes: any[] = Array.isArray(d.cnaes) ? d.cnaes : [];
  return (
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
        <Linha k="CNAE principal" v={d.cnae} />
        <Linha k="Atividade" v={d.descricao_atividade} />
        <Linha k="Grupo / Ocupação" v={`${d.grupo} • ${d.ocupacao}`} />
        <Linha k="Divisão" v={d.divisao} />
        <Linha k="Ocupação consolidada" v={ocupacaoTexto(d)} />
        {cnaes.length > 1 && cnaes.map((c: any, i: number) => (
          <Linha key={i} k={`CNAE ${i + 1}`} v={`${c.cnae} • ${c.divisao} • ${c.descricao}`} />
        ))}
        <Linha k="Carga de incêndio" v={d.carga_incendio_mj_m2 ? `${Number(d.carga_incendio_mj_m2).toFixed(2)} MJ/m²` : '—'} />
        <Linha k="Risco" v={d.risco_incendio} />

        <Text style={styles.h2}>3. Classificação física</Text>
        <Linha k="Área do terreno" v={d.area_total_m2 ? `${d.area_total_m2} m²` : '—'} />
        <Linha k="Área construída" v={d.area_construida_m2 ? `${d.area_construida_m2} m²` : '—'} />
        <Linha k="Altura da edificação" v={d.altura_edificacao_m ? `${d.altura_edificacao_m} m` : '—'} />
        <Linha k="Pavimentos" v={d.numero_pavimentos} />
        <Linha k={`Tipo (${nptOuIn((d.uf || 'PR') as UF, '005')})`} v={d.tipo_edificacao} />
        <Linha k={`Classe (${nptOuIn((d.uf || 'PR') as UF, '008')})`} v={d.classe_npt008} />
        <Linha k="TRRF" v={d.trrf_minutos != null ? `${d.trrf_minutos} min` : 'sem regra'} />

        <Text style={styles.h2}>4. Quadro resumo das medidas de segurança</Text>
        <View style={styles.qmHead}>
          <Text style={styles.qmCellNome}>MEDIDA DE SEGURANÇA</Text>
          <Text style={styles.qmCellNorma}>NORMA APLICÁVEL</Text>
          <Text style={styles.qmCellSim}>SITUAÇÃO</Text>
        </View>
        {(() => {
          // Mostra somente o que é EXIGIDO ou CONDICIONAL (oculta 'NÃO SE APLICA')
          const cscip: { nome: string; status: string }[] = d.medidas_cscip || [];
          const status = (nome: string): 'EXIGIDO' | 'CONDICIONAL' | null => {
            const chave = palavraChaveQuadro(nome);
            for (const m of cscip) {
              if ((m.nome || '').toLowerCase().includes(chave)) {
                if (m.status === 'EXIGIDO') return 'EXIGIDO';
                if (m.status === 'CONDICIONAL') return 'CONDICIONAL';
              }
            }
            // Fallback antigo: m.medidas_protecao só marca EXIGIDO
            if (medidaAtende(d, nome)) return 'EXIGIDO';
            return null;
          };
          const linhas = medidasQuadroParaUF((d.uf || 'PR') as UF)
            .map((m) => ({ ...m, st: status(m.nome) }))
            .filter((m) => m.st !== null);
          if (linhas.length === 0) {
            return (
              <Text style={[styles.small, { fontStyle: 'normal', marginTop: 6 }]}>
                Nenhuma medida exigida ou condicionada identificada para esta classificação.
              </Text>
            );
          }
          return linhas.map((m) => {
            const cor = m.st === 'EXIGIDO' ? '#437A22' : '#964219';
            const rotulo = m.st === 'EXIGIDO' ? 'EXIGIDA' : 'CONDICIONAL';
            return (
              <View key={m.nome} style={styles.qmRow}>
                <Text style={styles.qmCellNome}>{m.nome}</Text>
                <Text style={styles.qmCellNorma}>{m.norma}</Text>
                <Text style={[styles.qmCellSim, { color: cor }]}>{rotulo}</Text>
              </View>
            );
          });
        })()}
      </Page>
  );
}

function PageMemorialConstrucao({ d }: { d: any }) {
  return (
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Memorial básico de construção</Text>
        <Linha k="Endereço" v={d.endereco} />
        <Linha k="Município" v={`${d.cidade ?? ''}-${d.uf ?? ''}`} />
        <Linha k="Proprietário" v={d.proprietario} />
        <Linha k="Obra" v={d.nome_obra} />
        <Linha k="Ocupação" v={ocupacaoTexto(d)} />

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
  );
}

function PageInfoOperacional({ d }: { d: any }) {
  return (
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Planilha de informações operacionais</Text>
        {renderInfoOperacional(d)}
        <Assinatura d={d} />
      </Page>
  );
}

function PageSaidas({ d }: { d: any }) {
  return (
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Memorial de saídas de emergência ({rotuloNormaSaidas((d.uf || 'PR') as UF)})</Text>
        {renderSaidasPdf(d)}
        <Assinatura d={d} />
      </Page>
  );
}

function PageCargaIncendio({ d }: { d: any }) {
  return (
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Memorial de cálculo de carga de incêndio</Text>
        {renderCargaIncendio(d)}
        <Assinatura d={d} />
      </Page>
  );
}

function PageBrigada({ d }: { d: any }) {
  const uf = (d.uf || 'PR') as UF;

  // SC: cálculo segue IN-28 (GPF por divisão, isenção, treinamento)
  if (uf === 'SC') {
    const brig = Number(d.brigadistas_necessarios) || 0;
    const popFixa = Number(d.populacao_fixa ?? d.populacao_calculada) || 0;
    const isento = Boolean(d.brigada_isento);
    const treino = d.brigada_treinamento || 'Básico';
    return (
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Memorial de cálculo da brigada de incêndio (IN 28 do CBMSC)</Text>
        <Text style={[styles.pJustify, { marginTop: 8 }]}>
          Conforme a IN 28 do {rotuloCBM(uf)}, a brigada de incêndio é dimensionada
          pelo Grupo de População Fixa (GPF) aplicável à divisão de ocupação (Anexo A,
          Tabela 3 da IN 28). O número de brigadistas é obtido por: brigadistas = teto
          (população fixa ÷ GPF). Níveis de treinamento (Básico, Intermediário,
          Avançado, Misto) variam por divisão e por porte da edificação.
        </Text>
        <Text style={styles.h2}>Dados de entrada</Text>
        <Linha k="Ocupação" v={ocupacaoTexto(d)} />
        <Linha k="Divisão" v={d.grupo} />
        <Linha k="População fixa" v={`${popFixa} pessoa(s)`} />
        <Text style={styles.h2}>Resultado</Text>
        {isento ? (
          <Text style={styles.pJustify}>
            Conforme IN 28 do CBMSC, a edificação está dispensada da composição de
            brigada de incêndio em função do seu porte e da divisão de ocupação.
          </Text>
        ) : (
          <>
            <Linha k="Brigadistas necessários" v={`${brig} brigadista(s)`} />
            <Linha k="Nível de treinamento" v={treino} />
            <Linha k="Norma aplicável" v={rotuloNormaBrigada(uf)} />
          </>
        )}
        <Assinatura d={d} />
      </Page>
    );
  }

  // PR (default): mantém cálculo NPT 017 existente
  const grupo = (d.grupo || '').toString().toUpperCase().trim();
  const isF = grupo.startsWith('F');
  const popOriginal = Number(d.populacao_calculada) || 0;
  const popAjustada = Number(d.brigada_populacao_ajustada) || popOriginal;
  const brig = Number(d.brigadistas_necessarios) || 0;
  return (
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Memorial de cálculo da brigada de incêndio ({rotuloNormaBrigada('PR')})</Text>
        <Text style={[styles.pJustify, { marginTop: 8 }]}>
          Item 6.2 da {rotuloNormaBrigada('PR')}: a composição da brigada de incêndio será determinada pela
          população potencialmente exposta, conforme Tabela 1 da {rotuloNormaSaidas('PR')}, na proporção de
          1 brigadista orgânico para cada 200 (duzentas) pessoas, considerando-se o número
          inteiro imediatamente superior.
        </Text>
        <Text style={styles.pJustify}>
          {isF
            ? 'Quando se tratar do Grupo F (locais de reunião de público), a população considerada será acrescida em 30% antes da divisão por 200.'
            : 'A ocupação não pertence ao Grupo F; portanto não se aplica o acréscimo de 30% sobre a população.'}
        </Text>

        <Text style={styles.h2}>Dados de entrada</Text>
        <Linha k="Ocupação" v={ocupacaoTexto(d)} />
        <Linha k="Grupo" v={d.grupo} />
        <Linha k="População potencialmente exposta" v={`${popOriginal} pessoa(s)`} />
        <Linha k="Acréscimo Grupo F (30%)" v={isF ? 'Sim' : 'Não'} />
        <Linha k="População considerada" v={`${popAjustada} pessoa(s)`} />

        <Text style={styles.h2}>Cálculo</Text>
        <Text style={styles.pJustify}>
          {isF
            ? `${popOriginal} × 1,30 = ${popAjustada} pessoa(s) → ${popAjustada} ÷ 200 = ${(popAjustada / 200).toFixed(2)} → ${brig} brigadista(s).`
            : `${popAjustada} ÷ 200 = ${(popAjustada / 200).toFixed(2)} → ${brig} brigadista(s).`}
        </Text>
        <Linha k="Resultado" v={`${brig} brigadista(s) treinado(s)`} />
        <Linha k={`Critério ${rotuloNormaBrigada('PR')}`} v="1 brigadista a cada 200 pessoas (arredondamento para cima)" />
        <Text style={[styles.small, { marginTop: 8 }]}>
          Nota: com base no cálculo foi considerado 1 brigadista a cada 200 pessoas.
        </Text>
        <Assinatura d={d} />
      </Page>
  );
}

function PageAcessoViaturas({ d }: { d: any }) {
  return (
    <>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Memorial descritivo — Acesso de viaturas</Text>
        <Linha k="Proprietário" v={d.proprietario} />
        <Linha k="Logradouro" v={d.endereco} />
        <Linha k="Cidade" v={d.cidade} />
        <Linha k="Área total" v={d.area_total_m2 ? `${d.area_total_m2} m²` : '—'} />
        <Linha k="Descrição da obra" v={ocupacaoTexto(d)} />
        <Linha k="Responsável técnico" v={`${d.responsavel_tecnico ?? ''} ${d.crea_resp ?? ''}`} />

        <Text style={styles.h2}>1. Acesso de viaturas na edificação e áreas de risco</Text>
        <Text style={styles.pJustify}>{textoAcessoViaturas(d)}</Text>

        {d.acesso_viaturas && (d.acesso_viaturas.largura_via_m || d.acesso_viaturas.largura_portao_m) ? (
          <View style={{ marginTop: 6 }}>
            <Linha k="Largura da via (m)" v={d.acesso_viaturas.largura_via_m ?? '—'} />
            <Linha k="Largura do portão (m)" v={d.acesso_viaturas.largura_portao_m ?? '—'} />
            <Linha k="Altura do portão (m)" v={d.acesso_viaturas.altura_portao_m ?? '—'} />
          </View>
        ) : null}

        <View style={styles.figuraBox} wrap={false}>
          <Text style={styles.figuraTitulo}>Figura 1 — Largura de via de acesso.</Text>
          <Image style={styles.figuraImg} src={imgUrl('/imagens-npt006/01-largura-via.jpg')} />
          <Text style={styles.figuraFonte}>FONTE: {norma((d.uf || 'PR') as UF, '006')} — Acesso de viatura na edificação e áreas de risco.</Text>
        </View>
      </Page>

      {/* PÁGINA 7b — Figura 2: portão (perspectiva) */}
      <Page size="A4" style={styles.page}>
        <View style={styles.figuraBox} wrap={false}>
          <Text style={styles.figuraTitulo}>Figura 2 — Largura e altura mínima do portão de acesso.</Text>
          <Image style={styles.figuraImg} src={imgUrl('/imagens-npt006/02-portao-acesso.jpg')} />
          <Text style={styles.figuraFonte}>FONTE: {norma((d.uf || 'PR') as UF, '006')} — Acesso de viatura na edificação e áreas de risco.</Text>
        </View>

        <View style={styles.figuraBox} wrap={false}>
          <Text style={styles.figuraTitulo}>Figura 3 — Disposição das vias de acesso e retorno de viaturas.</Text>
          <Image style={styles.figuraImg} src={imgUrl('/imagens-npt006/03-retorno-edificio.jpg')} />
          <Text style={styles.figuraFonte}>FONTE: {norma((d.uf || 'PR') as UF, '006')} — Acesso de viatura na edificação e áreas de risco.</Text>
        </View>

        <Text style={[styles.pJustify, { marginTop: 8 }]}>
          Recomenda-se que as vias de acesso com extensão superior a 45,00 m possuam retornos em
          formato circular, em "Y" ou em "T", conforme modelos de retornos constantes na {norma((d.uf || 'PR') as UF, '005')}.
        </Text>

        <Assinatura d={d} />
      </Page>
    </>
  );
}

function PageTermoSaidas({ d }: { d: any }) {
  return (
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Termo de responsabilidade das saídas de emergência</Text>
        <Text style={[styles.pJustify, { marginTop: 18 }]}>{textoTermoSaidas(d)}</Text>
        <Text style={[styles.pJustify, { marginTop: 8 }]}>
          Assumo toda a responsabilidade civil e criminal quanto à permanência das portas
          em condições de uso imediato em caso de emergência.
        </Text>
        <Assinatura d={d} />
      </Page>
  );
}

export function MemorialPdf({ d, secoes }: { d: any; secoes?: SecaoMemorial[] }) {
  const inc = (key: SecaoMemorial) => incluiSecao(secoes, key);
  return (
    <Document>
      {inc('oficio') && <PageOficio d={d} />}
      {inc('classificacao') && <PageClassificacao d={d} />}
      {inc('memorial_construcao') && <PageMemorialConstrucao d={d} />}
      {inc('inf_operacional') && <PageInfoOperacional d={d} />}
      {inc('saidas') && <PageSaidas d={d} />}
      {inc('carga_incendio') && <PageCargaIncendio d={d} />}
      {inc('brigada') && <PageBrigada d={d} />}
      {inc('acesso_viaturas') && <PageAcessoViaturas d={d} />}
      {inc('termo_saidas') && <PageTermoSaidas d={d} />}
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
      <Linha k="1.2 Ocupação" v={ocupacaoTexto(d)} />
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
          foi obtida diretamente da tabela da {rotuloNormaCarga((d.uf || 'PR') as UF)}, conforme a
          ocupação principal da edificação.
        </Text>
        <View style={{ marginTop: 8 }}>
          <Linha k="Ocupação principal" v={ocupacaoTexto(d)} />
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
        por área de cada setor de ocupação, conforme {rotuloNormaCarga((d.uf || 'PR') as UF)}.
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
// Render: saídas (NPT 011 / IN 09)
// ============================================================================
function renderSaidasPdf(d: any) {
  const ufSai = (d.uf || 'PR') as UF;
  const labelSai = nptOuIn(ufSai, '011');
  const pavs: Pavimento[] = Array.isArray(d.saidas_pavimentos) ? d.saidas_pavimentos : [];

  // Bloco de caminhamento (Tabela 2 NPT 011) — sempre no início do memorial
  const divisaoPrincipal: string = d.divisao || '';
  const medidasCscip: { nome: string; status: string }[] = d.medidas_cscip || [];
  const temMedida = (chave: string) =>
    medidasCscip.some(
      (m) => m.status === 'EXIGIDO' && (m.nome || '').toLowerCase().includes(chave)
    );
  const camin = divisaoPrincipal
    ? calcularCaminhamento({
        divisao_principal: divisaoPrincipal,
        com_sprinkler: temMedida('chuveiro'),
        com_deteccao_fumaca: temMedida('detec'),
        leiaute_apresentado: Boolean(d.leiaute_apresentado),
      })
    : null;
  const blocoCaminhamento = camin ? (
    <View
      style={{
        marginBottom: 10,
        padding: 8,
        borderWidth: 1,
        borderColor: '#D4D1CA',
        borderRadius: 4,
      }}
    >
      <Text style={[styles.small, { fontWeight: 'bold', marginBottom: 3 }]}>
        Caminhamento conforme ocupação principal ({divisaoPrincipal} — faixa {camin.rotulo_faixa})
      </Text>
      <Text style={styles.pJustify}>{textoCaminhamento(camin)}</Text>
    </View>
  ) : null;

  if (pavs.length === 0) {
    return (
      <>
        {blocoCaminhamento}
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
      {blocoCaminhamento}
      {dims.map((dim) => {
        const p = pavs.find((pp) => pp.id === dim.pavimento_id);
        return (
        <View key={dim.pavimento_id} wrap={false} style={{ marginBottom: 10 }}>
          <Text style={styles.h3}>{dim.label}</Text>

          <View style={styles.tableHead}>
            <Text style={styles.cellL}>Ambiente</Text>
            <Text style={[styles.cellR, { width: '22%' }]}>Ocupação</Text>
            <Text style={styles.cellR}>Qtd.</Text>
            <Text style={[styles.cellR, { width: '22%' }]}>Critério</Text>
            <Text style={styles.cellR}>Pop. total</Text>
          </View>
          {dim.por_ambiente.map((a) => {
            const isDorm = a.unit === 'dorm';
            const netLabel = isDorm
              ? `${a.net} dorm.`
              : a.unit === 'vagas'
              ? `${a.net} vagas`
              : a.unit === 'assentos'
              ? `${a.net} assentos`
              : `${a.net.toFixed(2)} m²`;
            return (
            <View key={a.id} style={styles.tableRow}>
              <Text style={styles.cellL}>{limparNomeAmbiente(a.nome)}</Text>
              <Text style={[styles.cellR, { width: '22%' }]}>{a.divisao}</Text>
              <Text style={styles.cellR}>{netLabel}</Text>
              <Text style={[styles.cellR, { width: '22%' }]}>{popDesc(a.divisao)}</Text>
              <Text style={styles.cellR}>{a.pop} pess.</Text>
            </View>
            );
          })}
          <View style={styles.tableTotal}>
            <Text style={styles.cellL}>População total do pavimento</Text>
            <Text style={[styles.cellR, { width: '22%' }]}></Text>
            <Text style={styles.cellR}></Text>
            <Text style={[styles.cellR, { width: '22%' }]}></Text>
            <Text style={styles.cellR}>{dim.populacao_total} pess.</Text>
          </View>

          {/* MEMORIAL DE CÁLCULO: dimensionamento das UPs exigidas (N = P/C) */}
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.small, { fontWeight: 'bold', color: '#28251D' }]}>
              Dimensionamento das unidades de passagem ({itemNorma(ufSai, '011', '5.4')})
            </Text>
            <Text style={[styles.small, { fontStyle: 'italic', marginBottom: 3 }]}>
              Fórmula: N = P / C, onde N = unidades de passagem; P = população do pavimento;
              C = capacidade da unidade de passagem ({ufSai === 'SC' ? `Tabela 7 da ${labelSai}` : `Tabela 5 da ${labelSai}`}). Resultado arredondado
              para o número inteiro imediatamente superior.
            </Text>
            {dim.dimensionamento.map((comp) => {
              const nCalc = dim.populacao_total / Math.max(comp.c_critico, 1);
              const nUp = Math.ceil(nCalc);
              return (
                <View key={comp.mode} style={{ marginTop: 4 }}>
                  <Text style={[styles.small, { fontWeight: 'bold' }]}>
                    {comp.label} — C = {comp.c_critico} pessoas/UP
                  </Text>
                  <Text style={[styles.small, { paddingLeft: 10 }]}>
                    N = P / C
                  </Text>
                  <Text style={[styles.small, { paddingLeft: 10 }]}>
                    N = {dim.populacao_total} / {comp.c_critico}
                  </Text>
                  <Text style={[styles.small, { paddingLeft: 10 }]}>
                    N = {nCalc.toFixed(2)} → {nUp} UP (arredondado p/ cima)
                  </Text>
                  <Text style={[styles.small, { paddingLeft: 10 }]}>
                    Total exigido: {comp.total_up} UP × 0,55 m = {comp.total_largura_m.toFixed(2)} m
                    {' '}(largura mínima absoluta: {comp.min_largura.toFixed(2)} m)
                  </Text>
                </View>
              );
            })}
          </View>

          {/* CONFERÊNCIA: para cada elemento real, UP = largura / 0,55 */}
          {dim.verificacao.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.small, { fontWeight: 'bold', color: '#28251D' }]}>
                Conferência dos elementos executados ({itemNorma(ufSai, '011', '5.4.1')})
              </Text>
              <Text style={[styles.small, { fontStyle: 'italic', marginBottom: 3 }]}>
                Para cada componente real: UP = largura / 0,55 m, considerando apenas UPs inteiras
                (arredondamento para baixo). Quando há mais de um componente do mesmo tipo, as UPs
                são somadas.
              </Text>
              {dim.verificacao.map((v) => {
                const reais = ((p && p.saidas_reais) || []).filter((s: any) => s.tipo === v.tipo);
                return (
                  <View key={v.tipo} style={{ marginTop: 4 }}>
                    <Text style={[styles.small, { fontWeight: 'bold' }]}>{v.label}</Text>
                    {reais.length === 0 ? (
                      <Text style={[styles.small, { paddingLeft: 10, color: '#7B7666' }]}>
                        Nenhum elemento informado.
                      </Text>
                    ) : (
                      reais.map((el: any, idx: number) => {
                        const larg = Number(el.largura_m) || 0;
                        const qtd = Number(el.quantidade) || 0;
                        const upEl = Math.floor(larg / 0.55);
                        const ident = el.identificacao || `${v.label} ${idx + 1}`;
                        return (
                          <View key={idx} style={{ paddingLeft: 10 }}>
                            <Text style={styles.small}>{ident} ({qtd} un):</Text>
                            <Text style={[styles.small, { paddingLeft: 10 }]}>
                              UP = {larg.toFixed(2)} / 0,55 = {(larg / 0.55).toFixed(2)} → {upEl} UP cada
                            </Text>
                            {qtd > 1 && (
                              <Text style={[styles.small, { paddingLeft: 10 }]}>
                                Soma do tipo: {upEl} × {qtd} = {upEl * qtd} UP
                              </Text>
                            )}
                          </View>
                        );
                      })
                    )}
                    <Text style={[styles.small, { paddingLeft: 10, marginTop: 2 }]}>
                      <Text style={[styles.badge, v.atende ? styles.badgeOk : styles.badgeFail]}>
                        {' '}{v.atende ? 'ATENDE' : 'NÃO ATENDE'}{' '}
                      </Text>{' '}
                      {v.acesso_restrito
                        ? `Acesso restrito (pop. < 10) — mínimo 0,80 m por elemento`
                        : `Total real: ${v.up_real} UP • Exigido: ${v.up_exigido} UP`}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* CONSOLIDADO: soma porta + escada + rampa + acesso do mesmo bloco */}
          {dim.verificacao_consolidada && dim.verificacao.length > 1 && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.small, { fontWeight: 'bold', color: '#28251D' }]}>
                Verificação consolidada do bloco de saída
              </Text>
              <Text style={[styles.small, { fontStyle: 'italic', marginBottom: 3 }]}>
                Quando o mesmo bloco de saída combina porta + escada + rampa + acesso, as unidades
                de passagem dos componentes são somadas e comparadas com o componente mais
                restritivo.
              </Text>
              {dim.verificacao_consolidada.componentes.map((c, i) => (
                <Text key={i} style={[styles.small, { paddingLeft: 10 }]}>
                  {c.label}: {c.up} UP ({c.quantidade} un)
                </Text>
              ))}
              <Text style={[styles.small, { paddingLeft: 10, marginTop: 2 }]}>
                Total real consolidado: {dim.verificacao_consolidada.componentes
                  .map((c) => c.up)
                  .join(' + ')}{' = '}{dim.verificacao_consolidada.up_real_total} UP
              </Text>
              <Text style={[styles.small, { paddingLeft: 10 }]}>
                <Text style={[styles.badge, dim.verificacao_consolidada.atende ? styles.badgeOk : styles.badgeFail]}>
                  {' '}{dim.verificacao_consolidada.atende ? 'ATENDE' : 'NÃO ATENDE'}{' '}
                </Text>{' '}
                Consolidado: {dim.verificacao_consolidada.up_real_total} UP ≥ Exigido (mais restritivo): {dim.verificacao_consolidada.up_exigido} UP
              </Text>
            </View>
          )}
        </View>
        );
      })}
      {dims.length > 1 && (
        <View style={{ marginTop: 6 }}>
          <Text style={[styles.small, { fontWeight: 'bold' }]}>
            População total (todos os pavimentos): {dims.reduce((s, d) => s + d.populacao_total, 0)} pessoas
          </Text>
        </View>
      )}
      <Text style={styles.small}>
        UP = 0,55 m | Largura mínima: porta 0,80 m, escada/acesso 1,20 m | Total agrupado usa C mais
        restritivo ({itemNorma(ufSai, '011', '5.3.2.2')}).
      </Text>
    </>
  );
}

function popDesc(divisao: string): string {
  return DATA_SAIDAS[divisao]?.pop ?? '—';
}

export async function gerarPdfBlob(d: any, secoes?: SecaoMemorial[]): Promise<Blob> {
  return await pdf(<MemorialPdf d={d} secoes={secoes} />).toBlob();
}
