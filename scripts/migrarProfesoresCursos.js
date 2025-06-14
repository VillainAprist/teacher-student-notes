// scripts/migrarProfesoresCursos.js
// Script para unificar los campos 'profesor' y 'profesorEmail' en la colección 'cursos'.
// - Si 'profesor' es un email y 'profesorEmail' está vacío, busca el nombre del profesor en la colección 'usuarios' y actualiza ambos campos.
// - Si solo existe 'profesorEmail', busca el nombre y actualiza 'profesor'.
// - Si ambos existen pero 'profesor' es un email, reemplaza por el nombre.

import { db } from '../src/services/firebase.js';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';

async function migrarProfesoresCursos() {
  const cursosSnap = await getDocs(collection(db, 'cursos'));
  for (const cursoDoc of cursosSnap.docs) {
    const curso = cursoDoc.data();
    let profesorNombre = curso.profesor;
    let profesorEmail = curso.profesorEmail;
    let update = false;

    // Si profesor es un email
    if (profesorNombre && profesorNombre.includes('@')) {
      profesorEmail = profesorEmail || profesorNombre;
      // Buscar nombre real en usuarios
      const usuariosSnap = await getDocs(query(collection(db, 'usuarios'), where('email', '==', profesorEmail)));
      if (!usuariosSnap.empty) {
        profesorNombre = usuariosSnap.docs[0].data().nombre || profesorEmail;
      }
      update = true;
    }
    // Si solo hay profesorEmail
    if (!profesorNombre && profesorEmail) {
      // Buscar nombre real en usuarios
      const usuariosSnap = await getDocs(query(collection(db, 'usuarios'), where('email', '==', profesorEmail)));
      if (!usuariosSnap.empty) {
        profesorNombre = usuariosSnap.docs[0].data().nombre || profesorEmail;
        update = true;
      }
    }
    // Si ambos existen pero profesor es email
    if (profesorNombre && profesorEmail && profesorNombre === profesorEmail) {
      const usuariosSnap = await getDocs(query(collection(db, 'usuarios'), where('email', '==', profesorEmail)));
      if (!usuariosSnap.empty) {
        profesorNombre = usuariosSnap.docs[0].data().nombre || profesorEmail;
        update = true;
      }
    }
    if (update) {
      await updateDoc(doc(db, 'cursos', cursoDoc.id), {
        profesor: profesorNombre,
        profesorEmail: profesorEmail
      });
      console.log(`Curso ${cursoDoc.id} actualizado: profesor='${profesorNombre}', profesorEmail='${profesorEmail}'`);
    }
  }
  console.log('Migración completada.');
}

migrarProfesoresCursos();
