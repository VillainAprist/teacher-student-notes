import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

export function useCursosAlumno(alumnoId) {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!alumnoId) return;
    const fetchCursos = async () => {
      setLoading(true);
      // 1. Buscar inscripciones del alumno
      // CAMBIO: el campo correcto es 'alumnoUid', no 'alumnoId'
      const inscripcionesSnap = await getDocs(
        query(collection(db, 'inscripciones'), where('alumnoUid', '==', alumnoId))
      );
      const cursoIds = inscripcionesSnap.docs.map(doc => doc.data().cursoId);

      // 2. Buscar los cursos correspondientes
      const cursosData = [];
      for (const id of cursoIds) {
        const cursoDoc = await getDoc(doc(db, 'cursos', id));
        if (cursoDoc.exists()) {
          cursosData.push({ id: cursoDoc.id, ...cursoDoc.data() });
        }
      }
      setCursos(cursosData);
      setLoading(false);
    };
    fetchCursos();
  }, [alumnoId]);

  return { cursos, loading };
}
