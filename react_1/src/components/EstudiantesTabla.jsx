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
}) {
  // Usar el custom hook para manejar edición
  const {
    editAlumnoIdx,
    editNotas,
    setEditNotas,
    iniciarEdicion,
    cancelarEdicion
  } = useEdicionNotas(estudiantes);

  return (
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
          <th>Nota Final</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {estudiantes.map((est, i) => {
          const pc1 = est.notas?.pc1 ?? '';
          const pc2 = est.notas?.pc2 ?? '';
          const parcial = est.notas?.parcial ?? '';
          const final = est.notas?.final ?? '';
          const extrasValues = notasExtras.map(n => est.notas?.[n.nombre] ?? '');
          const notaFinal = calcularNotaFinal(est.notas, notasExtras);
          return editAlumnoIdx === i ? (
            <tr key={i}>
              <td>{est.nombre}</td>
              <td><NotaInput value={editNotas.pc1} onChange={e => setEditNotas({ ...editNotas, pc1: e.target.value })} placeholder="PC1" /></td>
              <td><NotaInput value={editNotas.pc2} onChange={e => setEditNotas({ ...editNotas, pc2: e.target.value })} placeholder="PC2" /></td>
              <td><NotaInput value={editNotas.parcial} onChange={e => setEditNotas({ ...editNotas, parcial: e.target.value })} placeholder="Parcial" /></td>
              <td><NotaInput value={editNotas.final} onChange={e => setEditNotas({ ...editNotas, final: e.target.value })} placeholder="Final" /></td>
              {notasExtras.map((nota, idx) => (
                <td key={nota.nombre}><NotaInput value={editNotas[nota.nombre]} onChange={e => setEditNotas({ ...editNotas, [nota.nombre]: e.target.value })} placeholder={nota.label} /></td>
              ))}
              <td>{notaFinal.toFixed(2)}</td>
              <td>
                <button className="btn btn-success btn-sm me-1" onClick={() => guardarNotasEditadas(i, editNotas)}>Guardar</button>
                <button className="btn btn-secondary btn-sm" onClick={cancelarEdicion}>Cancelar</button>
              </td>
            </tr>
          ) : (
            <tr key={i}>
              <td>
                <span
                  style={{ color: '#A05252', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => handleVerPerfilAlumno(est.nombre, est.codigo, est.uid)}
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
              <td>{notaFinal.toFixed(2)}</td>
              <td>
                <button className="btn btn-warning btn-sm" onClick={() => iniciarEdicion(i)}>Editar</button>
                <button className="btn btn-danger btn-sm ms-1" onClick={() => eliminarEstudiante(i)}>Eliminar</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
