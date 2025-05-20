// src/services/cursosService.js
import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, where } from 'firebase/firestore';

/**
 * Servicio para operaciones CRUD de cursos en Firestore.
 */
export const cursosService = {
  async agregarCurso({ nombre, escuela, seccion, profesor, profesorUid }) {
    const nuevo = {
      nombre,
      escuela,
      seccion,
      estudiantes: [],
      profesor,
      profesorUid
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

  async crearInscripcion({ cursoId, alumnoUid, alumnoEmail, alumnoCodigo }) {
    await addDoc(collection(db, 'inscripciones'), {
      cursoId,
      alumnoUid,
      alumnoEmail,
      alumnoCodigo,
      fecha: new Date()
    });
  }
};
