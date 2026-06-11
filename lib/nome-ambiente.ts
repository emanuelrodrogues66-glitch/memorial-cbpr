// Remove códigos/IDs que costumam vir no nome do ambiente, principalmente
// quando importado do Revit. Mantém apenas o nome legível.
// Exemplos cobertos:
//   '— LIVRARIA 245'   -> 'LIVRARIA'
//   'SALA 1 246'       -> 'SALA 1' (ID Revit tem 3+ dígitos, preserva número de ordem)
//   'TEMPLO 252'       -> 'TEMPLO'
//   '001 - Sala'       -> 'Sala'
//   'AMB-12 Recepção'  -> 'Recepção'
//   'Sala [245]'       -> 'Sala'
//   'Room 12: Cozinha' -> 'Cozinha'

export function limparNomeAmbiente(nome: string): string {
  if (!nome) return nome;
  let s = String(nome).trim();

  // 0) remove bullets/marcadores no início: '— Sala', '- Sala', '• Sala'
  s = s.replace(/^[\s—–\-•∙·*]+/, '').trim();

  // 1) remove ID numérico do Revit no FINAL (3+ dígitos): 'SALA 1 246' -> 'SALA 1',
  //    'LIVRARIA 245' -> 'LIVRARIA'. Preserva 'SALA 1', 'BLOCO 2', etc.
  s = s.replace(/\s+\d{3,6}\s*$/, '').trim();

  // 2) remove ID entre colchetes/parênteses no final: 'Sala [245]', 'Sala (245)'
  s = s.replace(/\s*[\[\(\{]\s*\d{1,6}\s*[\]\)\}]\s*$/, '').trim();

  // 3) Prefixos de código no início: AMB-12, ROOM 12, A-12, 001, #12, [12]
  const padroes = [
    /^[\[\(\{]\s*[A-Z]{0,4}[-_ ]?\d+\s*[\]\)\}]\s*[-:–_\.]?\s*(.+)$/i,
    /^#\s*[A-Z]{0,4}[-_ ]?\d+\s*[-:–_\.]?\s*(.+)$/i,
    /^(?:AMB|ROOM|SALA|ESP|ESPACO|ESPAÇO|REC|AMBIENTE|R)[-_ \.]?\d+\s*[-:–_\.]?\s+(.+)$/i,
    /^[A-Z]{1,4}[-_ \.]?\d+\s*[-:–_\.]\s*(.+)$/i,
    /^\d+\s*[-:–_\.]\s*(.+)$/,
    /^\d{3,6}\s+([A-Za-zÀ-ž].+)$/,
  ];
  for (let i = 0; i < 4; i++) {
    let mudou = false;
    for (const re of padroes) {
      const m = s.match(re);
      if (m && m[1] && m[1].trim().length > 0 && m[1].length < s.length) {
        s = m[1].trim();
        mudou = true;
        break;
      }
    }
    if (!mudou) break;
  }
  return s || nome;
}
