// utils/edicionNotas.js
import { useState } from 'react';

/**
 * Hook para manejar la edición de notas de estudiantes en una tabla.
 * @param {Array} estudiantes - Lista de estudiantes con sus notas.
 * @returns {Object} Estado y handlers para edición de notas.
 */
export function useEdicionNotas(estudiantes) {
  const [editAlumnoIdx, setEditAlumnoIdx] = useState(null);
  const [editNotas, setEditNotas] = useState({});

  // Iniciar edición de un estudiante
  const iniciarEdicion = (idx) => {
    setEditAlumnoIdx(idx);
    setEditNotas({ ...estudiantes[idx].notas });
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setEditAlumnoIdx(null);
    setEditNotas({});
  };

  // Guardar edición (delega la acción al padre)
  // El padre debe implementar la función guardarNotasEditadas(idx, editNotas)

  return {
    editAlumnoIdx,
    editNotas,
    setEditNotas,
    iniciarEdicion,
    cancelarEdicion
  };
}
