// PDF do Memorial Descritivo CBPR via @react-pdf/renderer
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import React from 'react';
import { getMedidasCSCIP } from './cscip-medidas';
import { dimensionarTodos, DATA_SAIDAS, type Pavimento, type DimPavimento } from './saidas-npt011';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#28251D' },
  h1: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  h2: { fontSize: 12, fontWeight: 'bold', marginTop: 14, marginBottom: 6, color: '#01696F' },
  h3: { fontSize: 10, fontWeight: 'bold', marginTop: 8, marginBottom: 4, color: '#28251D' },
  p: { lineHeight: 1.5, marginBottom: 4 },
  row: { flexDirection: 'row', borderBottom: '1px solid #D4D1CA', paddingVertical: 4 },
  rowKey: { width: '38%', color: '#7A7974' },
  rowVal: { width: '62%', fontWeight: 'bold' },
  bullets: { paddingLeft: 12 },
  small: { fontSize: 8, color: '#7A7974', marginTop: 4 },
  tableHead: { flexDirection: 'row', backgroundColor: '#F9F8F5', borderBottom: '1px solid #D4D1CA', padding: 3, fontWeight: 'bold', fontSize: 8 },
  tableRow: { flexDirection: 'row', borderBottom: '0.5px solid #E5E3DD', padding: 3, fontSize: 8 },
  tableTotal: { flexDirection: 'row', borderTop: '1px solid #28251D', padding: 3, fontWeight: 'bold', fontSize: 8 },
  cellL: { width: '34%' },
  cellR: { width: '11%', textAlign: 'right' },
  cellRWide: { width: '12%', textAlign: 'right' },
  badge: { padding: 2, borderRadius: 2, fontSize: 7, fontWeight: 'bold', color: '#FFFFFF' },
  badgeOk: { backgroundColor: '#437A22' },
  badgeFail: { backgroundColor: '#A12C7B' }
});

function Linha({ k, v }: { k: string; v: any }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowKey}>{k}</Text>
      <Text style={styles.rowVal}>{v == null || v === '' ? '—' : String(v)}</Text>
    </View>
  );
}

export function MemorialPdf({ d }: { d: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Memorial Descritivo de Segurança Contra Incêndio</Text>
        <Text style={styles.small}>Conforme normativas do Corpo de Bombeiros do Paraná (CBPR) — NPTs 005, 008, 011, 017</Text>

        <Text style={styles.h2}>1. Dados da obra</Text>
        <Linha k="Nome da obra" v={d.nome_obra} />
        <Linha k="Proprietário" v={d.proprietario} />
        <Linha k="CPF / CNPJ" v={d.cpf_cnpj} />
        <Linha k="Endereço" v={d.endereco} />
        <Linha k="Cidade / UF" v={`${d.cidade ?? ''} / ${d.uf ?? ''}`} />
        <Linha k="CEP" v={d.cep} />
        <Linha k="Telefone" v={d.telefone} />
        <Linha k="E-mail" v={d.email_contato} />

        <Text style={styles.h2}>2. Classificação da edificação</Text>
        <Linha k="CNAE" v={d.cnae} />
        <Linha k="Atividade" v={d.descricao_atividade} />
        <Linha k="Grupo / Ocupação" v={`${d.grupo} • ${d.ocupacao}`} />
        <Linha k="Divisão" v={d.divisao} />
        <Linha k="Carga de incêndio" v={d.carga_incendio_mj_m2 ? `${d.carga_incendio_mj_m2} MJ/m²` : '—'} />
        <Linha k="Risco" v={d.risco_incendio} />

        <Text style={styles.h2}>3. Características físicas</Text>
        <Linha k="Área do terreno" v={d.area_total_m2 ? `${d.area_total_m2} m²` : '—'} />
        <Linha k="Área construída" v={d.area_construida_m2 ? `${d.area_construida_m2} m²` : '—'} />
        <Linha k="Altura da edificação" v={d.altura_edificacao_m ? `${d.altura_edificacao_m} m` : '—'} />
        <Linha k="Pavimentos" v={d.numero_pavimentos} />
        <Linha k="Tipo (NPT 005)" v={d.tipo_edificacao} />
        <Linha k="Classe (NPT 008)" v={d.classe_npt008} />
        <Linha k="TRRF" v={d.trrf_minutos != null ? `${d.trrf_minutos} min` : 'sem regra'} />

        <Text style={styles.h2}>4. Memorial de saídas (NPT 011)</Text>
        {renderSaidasPdf(d)}

        <Text style={styles.h2}>5. Brigada de incêndio (NPT 017)</Text>
        <Linha k="Brigadistas" v={d.brigadistas_necessarios} />
        <Linha k="Critério" v={d.brigadistas_descricao} />

        <Text style={styles.h2}>6. Medidas de segurança contra incêndio (CSCIP/PR)</Text>
        <View style={styles.bullets}>
          {medidasComStatus(d).map((m, i) => (
            <View key={i} style={{ marginBottom: 4 }}>
              <Text style={styles.p}>
                • {m.nome}{' '}
                <Text style={{ color: m.status === 'EXIGIDO' ? '#A32D2D' : '#854F0B', fontSize: 8 }}>
                  [{m.status === 'EXIGIDO' ? 'Exigido' : 'Condicional'}]
                </Text>
              </Text>
              {m.observacao && (
                <Text style={{ fontSize: 8, color: '#7A7974', paddingLeft: 10 }}>
                  {m.observacao}
                </Text>
              )}
            </View>
          ))}
        </View>

        <Text style={styles.h2}>7. Responsável técnico</Text>
        <Linha k="Nome" v={d.responsavel_tecnico} />
        <Linha k="CREA / CAU" v={d.crea_resp} />
        {d.observacoes ? (
          <>
            <Text style={styles.h2}>Observações</Text>
            <Text style={styles.p}>{d.observacoes}</Text>
          </>
        ) : null}

        <Text style={[styles.small, { marginTop: 24 }]}>
          Documento gerado eletronicamente. Os cálculos seguem regras simplificadas das NPTs do CBPR e devem
          ser validados pelo responsável técnico antes do protocolo.
        </Text>
      </Page>
    </Document>
  );
}

// Combina lista do CSCIP (Exigido/Condicional + obs) com as escolhas do usuário.
// Mostra todos os Exigidos sempre; mostra Condicionais só se o usuário marcou.
function medidasComStatus(
  d: any
): { nome: string; status: 'EXIGIDO' | 'CONDICIONAL'; observacao?: string }[] {
  const escolhidas = new Set<string>(d.medidas_protecao ?? []);
  const lista = getMedidasCSCIP(
    d.divisao ?? '',
    Number(d.area_construida_m2) || 0,
    Number(d.altura_edificacao_m) || 0
  ).medidas;
  if (lista.length === 0) {
    // fallback: usa só a lista escolhida sem status
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
