// utils/calculoNotas.js
/**
 * Calcula la nota final de un estudiante según las reglas del sistema.
 * @param {Object} notas - Objeto con las notas del estudiante (pc1, pc2, parcial, final, opc1, opc2, ...)
 * @param {Array} notasExtras - Array de objetos de notas extra [{nombre, label, valor}]
 * @returns {number} Nota final calculada (máximo 20)
 */
export function calcularNotaFinal(notas, notasExtras) {
  const pc1 = +notas.pc1 || 0;
  const pc2 = +notas.pc2 || 0;
  const parcial = +notas.parcial || 0;
  const final = +notas.final || 0;
  const extrasKeys = notasExtras.map(n => n.nombre).filter(k => notas[k] !== '' && !isNaN(notas[k]));
  let promedioExtras = 0;
  if (extrasKeys.length > 0) {
    promedioExtras = extrasKeys.reduce((acc, k) => acc + (+notas[k] || 0), 0) / extrasKeys.length;
  }
  let promedioPC = 0;
  if (extrasKeys.length > 0) {
    promedioPC = ((pc1 + pc2) / 2) * 0.5 + promedioExtras * 0.5;
  } else {
    promedioPC = (pc1 + pc2) / 2;
  }
  let notaFinal = (promedioPC * 0.4) + (parcial * 0.3) + (final * 0.3);
  if (notaFinal > 20) notaFinal = 20;
  return notaFinal;
}
