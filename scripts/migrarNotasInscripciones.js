// Script para migrar inscripciones antiguas y agregar el campo notas si no existe
import { db } from '../src/services/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

async function migrarNotasInscripciones() {
  const inscripcionesSnap = await getDocs(collection(db, 'inscripciones'));
  for (const inscripcion of inscripcionesSnap.docs) {
    const data = inscripcion.data();
    if (!data.notas) {
      await updateDoc(doc(db, 'inscripciones', inscripcion.id), { notas: {} });
      console.log(`Actualizado inscripción ${inscripcion.id} con campo notas vacío.`);
    }
  }
  console.log('Migración completada.');
}

migrarNotasInscripciones();
