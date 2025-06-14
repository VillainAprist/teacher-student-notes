// src/services/cursosService.js
import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, where } from 'firebase/firestore';

/**
 * Servicio para operaciones CRUD de cursos en Firestore.
 */
export const cursosService = {
  async agregarCurso({ nombre, escuela, seccion, profesor, profesorUid, profesorEmail, profesorNombre }) {
    const nuevo = {
      nombre,
      escuela,
      seccion,
      estudiantes: [],
      profesor, // puede ser nombre o email según flujo
      profesorUid,
      profesorEmail: profesorEmail || '',
      profesorNombre: profesorNombre || ''
    };
    const docRef = await addDoc(collection(db, 'cursos'), nuevo);
    return docRef;
  },

  async eliminarCurso(id) {
    await deleteDoc(doc(db, 'cursos', id));
  },

  async actualizarEstudiantes(cursoId, estudiantes) {
    await updateDoc(doc(db, 'cursos', cursoId), { estudiantes });
  },

  async buscarUsuarioPorCampo(campo, valor) {
    const snap = await getDocs(query(collection(db, 'usuarios'), where(campo, '==', valor)));
    return snap.empty ? null : snap.docs[0];
  },

  async crearInscripcion({ cursoId, alumnoUid, alumnoEmail, alumnoCodigo, notas }) {
    await addDoc(collection(db, 'inscripciones'), {
      cursoId,
      alumnoUid,
      alumnoEmail,
      alumnoCodigo,
      fecha: new Date(),
      notas: notas || {} // Asegura que se cree el campo notas si se pasa
    });
  },

  async actualizarNotasInscripcion({ cursoId, alumnoUid, notas }) {
    // Busca el documento de inscripción por cursoId y alumnoUid
    const snap = await getDocs(query(collection(db, 'inscripciones'), where('cursoId', '==', cursoId), where('alumnoUid', '==', alumnoUid)));
    if (!snap.empty) {
      const inscripcionDoc = snap.docs[0];
      await updateDoc(inscripcionDoc.ref, { notas });
    }
  }
};
