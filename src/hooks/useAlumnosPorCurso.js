import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Hook para obtener los alumnos inscritos en un curso a partir de la colección inscripciones.
 * @param {string} cursoId - ID del curso.
 * @returns {Array} alumnos - Lista de inscripciones (puedes mapear a datos completos si lo necesitas).
 */
export function useAlumnosPorCurso(cursoId) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cursoId) return;
    const fetchAlumnos = async () => {
      setLoading(true);
      const inscripcionesSnap = await getDocs(
        query(collection(db, 'inscripciones'), where('cursoId', '==', cursoId))
      );
      const alumnosData = inscripcionesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlumnos(alumnosData);
      setLoading(false);
    };
    fetchAlumnos();
  }, [cursoId]);

  return { alumnos, loading };
}
