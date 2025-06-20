import { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export function useUnreadNotificaciones(user) {
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    let unsub = null;
    try {
      const q = query(
        collection(db, 'notificaciones'),
        where('usuarioUid', '==', user.uid),
        where('leido', '==', false)
      );
      unsub = onSnapshot(
        q,
        (snap) => {
          setUnread(snap.size);
          setError(null);
        },
        (err) => {
          setError('No se pudo consultar notificaciones. Es posible que falte un índice en Firestore.');
          setUnread(0);
        }
      );
    } catch (e) {
      setError('No se pudo consultar notificaciones.');
      setUnread(0);
    }
    return () => unsub && unsub();
  }, [user]);

  return [unread, error];
}
