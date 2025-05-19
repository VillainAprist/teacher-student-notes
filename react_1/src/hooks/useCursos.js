import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Hook para obtener cursos desde Firestore.
 * @param {Object} [options] - Opciones de filtrado.
 * @param {string} [options.profesorEmail] - Email del profesor para filtrar cursos.
 * @param {string} [options.alumno] - Nombre/email/código del alumno para filtrar cursos inscritos.
 * @param {string} [options.codigoAlumno] - Código del alumno (opcional).
 * @returns {Array} cursos
 */
export function useCursos(options = {}) {
  const [cursos, setCursos] = useState([]);

  useEffect(() => {
    const fetchCursos = async () => {
      let cursosCol;
      if (options.profesorEmail) {
        cursosCol = query(collection(db, 'cursos'), where('profesor', '==', options.profesorEmail));
      } else {
        cursosCol = collection(db, 'cursos');
      }
      const cursosSnapshot = await getDocs(cursosCol);
      let cursosData = cursosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Si se pasa alumno, filtra los cursos donde está inscrito
      if (options.alumno) {
        cursosData = cursosData.filter(curso =>
          curso.estudiantes && curso.estudiantes.some(e =>
            e.nombre === options.alumno ||
            e.email === options.alumno ||
            e.codigo === (options.codigoAlumno || '')
          )
        );
      }
      setCursos(cursosData);
    };
    fetchCursos();
    // eslint-disable-next-line
  }, [options.profesorEmail, options.alumno, options.codigoAlumno]);

  return cursos;
}
