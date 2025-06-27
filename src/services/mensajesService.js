// src/services/mensajesService.js
import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';

export const mensajesService = {
  async enviarMensaje({ remitenteUid, remitenteNombre, remitenteCorreo, destinatarioUid, destinatarioNombre, destinatarioCorreo, asunto, mensaje }) {
    await addDoc(collection(db, 'mensajes'), {
      remitenteUid,
      remitenteNombre,
      remitenteCorreo,
      destinatarioUid,
      destinatarioNombre,
      destinatarioCorreo,
      asunto,
      mensaje,
      fecha: Timestamp.now(),
      leido: false
    });
    // Crear notificación básica para el destinatario
    await addDoc(collection(db, 'notificaciones'), {
      usuarioUid: destinatarioUid,
      tipo: 'mensaje_recibido',
      mensaje: `Recibiste un mensaje de ${remitenteNombre} (${remitenteCorreo})`,
      leido: false,
      fecha: Timestamp.now()
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
