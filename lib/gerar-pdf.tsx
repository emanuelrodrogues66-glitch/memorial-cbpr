// PDF do Memorial Descritivo CBPR via @react-pdf/renderer
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import React from 'react';
import { getMedidasCSCIP } from './cscip-medidas';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#28251D' },
  h1: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  h2: { fontSize: 12, fontWeight: 'bold', marginTop: 14, marginBottom: 6, color: '#01696F' },
  p: { lineHeight: 1.5, marginBottom: 4 },
  row: { flexDirection: 'row', borderBottom: '1px solid #D4D1CA', paddingVertical: 4 },
  rowKey: { width: '38%', color: '#7A7974' },
  rowVal: { width: '62%', fontWeight: 'bold' },
  bullets: { paddingLeft: 12 },
  small: { fontSize: 8, color: '#7A7974', marginTop: 4 }
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

        <Text style={styles.h2}>4. População e saídas (NPT 011)</Text>
        <Linha k="População" v={d.populacao_calculada} />
        <Linha k="Critério" v={d.populacao_descricao_npt011} />
        <Linha k="Unid. passagem — acesso/descarga" v={d.unidades_passagem_acesso} />
        <Linha k="Unid. passagem — escada" v={d.unidades_passagem_escada} />
        <Linha k="Unid. passagem — porta" v={d.unidades_passagem_porta} />

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

export async function gerarPdfBlob(d: any): Promise<Blob> {
  return await pdf(<MemorialPdf d={d} />).toBlob();
}
