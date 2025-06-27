// Tabla de estudiantes modularizada desde ProfesorPanel
import React from 'react';
import { calcularNotaFinal } from '../utils/calculoNotas';
import { useEdicionNotas } from '../utils/edicionNotas';
import NotaInput from './NotaInput';

export default function EstudiantesTabla({
  estudiantes,
  notasExtras,
  handleVerPerfilAlumno,
  guardarNotasEditadas,
  eliminarEstudiante,
  edicionMasiva = false,
  setNotasPendientes,
  notasPendientes = {},
  setEditAlumnoIdx
}) {
  // Si los estudiantes vienen de inscripciones, mapea a un formato mínimo para mostrar
  const estudiantesMapeados = estudiantes.map(est => ({
    nombre: est.alumnoNombre || est.nombre || '-',
    email: est.alumnoEmail || est.email || '-',
    codigo: est.alumnoCodigo || est.codigo || '-',
    uid: est.alumnoUid || est.uid || '',
    notas: est.notas || {},
    // Añadir campos susti y aplaz si existen
    susti: est.notas?.sustitutorio || est.notas?.susti || '',
    aplaz: est.notas?.aplazado || est.notas?.aplaz || ''
  }));
  // Usar el custom hook para manejar edición
  const {
    editAlumnoIdx,
    editNotas,
    setEditNotas,
    iniciarEdicion,
    cancelarEdicion
  } = useEdicionNotas(estudiantesMapeados);

  // Si edición masiva, todos los alumnos están en modo edición
  return (
    <form>
      <table className="table table-bordered mt-3">
        <thead>
          <tr>
            <th>Estudiante</th>
            <th>PC1</th>
            <th>PC2</th>
            <th>Parcial</th>
            <th>Final</th>
            {notasExtras.map((nota, idx) => (
              <th key={nota.nombre}>{nota.label}</th>
            ))}
            <th>Susti</th>
            <th>Aplaz</th>
            <th>Nota Final</th>
            {!edicionMasiva && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {estudiantesMapeados.map((est, i) => {
            const pc1 = est.notas?.pc1 ?? '';
            const pc2 = est.notas?.pc2 ?? '';
            const parcial = est.notas?.parcial ?? '';
            const final = est.notas?.final ?? '';
            const extrasValues = notasExtras.map(n => est.notas?.[n.nombre] ?? '');
            const susti = est.notas?.sustitutorio ?? est.notas?.susti ?? '';
            const aplaz = est.notas?.aplazado ?? est.notas?.aplaz ?? '';
            // Calcular nota final considerando susti y aplaz
            let notaFinal = calcularNotaFinal({ ...est.notas, susti, aplaz }, notasExtras);
            // Si está editando, mostrar el promedio en tiempo real
            const isEditing = edicionMasiva || editAlumnoIdx === i;
            let editValues = edicionMasiva ? (notasPendientes[est.uid] || est.notas) : editNotas;
            let notaFinalEdicion = calcularNotaFinal({ ...editValues, susti: editValues.susti, aplaz: editValues.aplaz }, notasExtras);
            if (isEditing) {
              return (
                <tr key={i}>
                  <td>{est.nombre}</td>
                  <td><NotaInput value={editValues.pc1} onChange={e => {
                    const val = e.target.value;
                    if (edicionMasiva) setNotasPendientes(prev => ({ ...prev, [est.uid]: { ...prev[est.uid], pc1: val } }));
                    else setEditNotas({ ...editNotas, pc1: val });
                  }} placeholder="PC1" name="pc1" autoFocus={i === 0} tabIndex={1} /></td>
                  <td><NotaInput value={editValues.pc2} onChange={e => {
                    const val = e.target.value;
                    if (edicionMasiva) setNotasPendientes(prev => ({ ...prev, [est.uid]: { ...prev[est.uid], pc2: val } }));
                    else setEditNotas({ ...editNotas, pc2: val });
                  }} placeholder="PC2" name="pc2" tabIndex={2} /></td>
                  <td><NotaInput value={editValues.parcial} onChange={e => {
                    const val = e.target.value;
                    if (edicionMasiva) setNotasPendientes(prev => ({ ...prev, [est.uid]: { ...prev[est.uid], parcial: val } }));
                    else setEditNotas({ ...editNotas, parcial: val });
                  }} placeholder="Parcial" name="parcial" tabIndex={3} /></td>
                  <td><NotaInput value={editValues.final} onChange={e => {
                    const val = e.target.value;
                    if (edicionMasiva) setNotasPendientes(prev => ({ ...prev, [est.uid]: { ...prev[est.uid], final: val } }));
                    else setEditNotas({ ...editNotas, final: val });
                  }} placeholder="Final" name="final" tabIndex={4} /></td>
                  {notasExtras.map((nota, idx) => (
                    <td key={nota.nombre}><NotaInput value={editValues[nota.nombre]} onChange={e => {
                      const val = e.target.value;
                      if (edicionMasiva) setNotasPendientes(prev => ({ ...prev, [est.uid]: { ...prev[est.uid], [nota.nombre]: val } }));
                      else setEditNotas({ ...editNotas, [nota.nombre]: val });
                    }} placeholder={nota.label} name={nota.nombre} tabIndex={5+idx} /></td>
                  ))}
                  <td><NotaInput value={editValues.susti} onChange={e => {
                    const val = e.target.value;
                    if (edicionMasiva) setNotasPendientes(prev => ({ ...prev, [est.uid]: { ...prev[est.uid], susti: val } }));
                    else setEditNotas({ ...editNotas, susti: val });
                  }} placeholder="Susti" name="susti" tabIndex={10} /></td>
                  <td><NotaInput value={editValues.aplaz} onChange={e => {
                    const val = e.target.value;
                    if (edicionMasiva) setNotasPendientes(prev => ({ ...prev, [est.uid]: { ...prev[est.uid], aplaz: val } }));
                    else setEditNotas({ ...editNotas, aplaz: val });
                  }} placeholder="Aplaz" name="aplaz" tabIndex={11} /></td>
                  <td><strong>{notaFinalEdicion.toFixed(2)}</strong></td>
                  {!edicionMasiva && <td>
                    <button type="button" className="btn btn-success btn-sm me-1" onClick={() => guardarNotasEditadas(i, editNotas)}>Guardar</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={cancelarEdicion}>Cancelar</button>
                  </td>}
                </tr>
              );
            } else {
              return (
                <tr key={i}>
                  <td>
                    <span
                      style={{ color: '#A05252', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => window.open(`/usuario/${est.uid}`, '_blank')}
                    >
                      {est.nombre}
                    </span>
                  </td>
                  <td>{pc1}</td>
                  <td>{pc2}</td>
                  <td>{parcial}</td>
                  <td>{final}</td>
                  {extrasValues.map((val, idx) => (
                    <td key={idx}>{val}</td>
                  ))}
                  <td>{susti}</td>
                  <td>{aplaz}</td>
                  <td>{notaFinal.toFixed(2)}</td>
                  <td>
                    <button type="button" className="btn btn-warning btn-sm" onClick={() => iniciarEdicion(i)}>Editar</button>
                  </td>
                </tr>
              );
            }
          })}
        </tbody>
      </table>
    </form>
  );
}
