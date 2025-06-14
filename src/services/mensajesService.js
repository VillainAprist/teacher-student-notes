// src/services/mensajesService.js
import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';

export const mensajesService = {
  async enviarMensaje({ remitenteUid, remitenteNombre, destinatarioUid, destinatarioNombre, asunto, mensaje }) {
    await addDoc(collection(db, 'mensajes'), {
      remitenteUid,
      remitenteNombre,
      destinatarioUid,
      destinatarioNombre,
      asunto,
      mensaje,
      fecha: new Date(),
      leido: false
    });
  },

  async obtenerMensajesRecibidos(uid) {
    const q = query(collection(db, 'mensajes'), where('destinatarioUid', '==', uid), orderBy('fecha', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async obtenerMensajesEnviados(uid) {
    const q = query(collection(db, 'mensajes'), where('remitenteUid', '==', uid), orderBy('fecha', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async marcarComoLeido(mensajeId) {
    await updateDoc(doc(db, 'mensajes', mensajeId), { leido: true });
  }
};
