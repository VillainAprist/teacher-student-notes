// src/services/notificacionesService.js
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

/**
 * Servicio para crear notificaciones en Firestore.
 */
export const notificacionesService = {
  /**
   * Crea una notificación para un usuario.
   * @param {Object} params
   * @param {string} params.usuarioUid - UID del usuario destinatario
   * @param {string} params.titulo - Título de la notificación
   * @param {string} params.mensaje - Mensaje de la notificación
   * @param {string} [params.tipo] - Tipo de notificación (opcional)
   * @param {Object} [params.extra] - Datos extra (opcional)
   */
  async crearNotificacion({ usuarioUid, titulo, mensaje, tipo = 'info', extra = {} }) {
    await addDoc(collection(db, 'notificaciones'), {
      usuarioUid,
      titulo,
      mensaje,
      tipo,
      extra,
      leido: false,
      fecha: new Date()
    });
  }
};
