import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { FaBell, FaCheckCircle } from "react-icons/fa";

const tipoLabels = {
  curso_agregado: "Te agregaron a un curso",
  notas_actualizadas: "Notas actualizadas",
  profesor_asignado: "Te asignaron un curso (profesor)"
};

function Notificaciones({ user }) {
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "notificaciones"),
      where("usuarioUid", "==", user.uid),
      orderBy("fecha", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotificaciones(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
    return () => unsub();
  }, [user]);

  const marcarLeida = async (id) => {
    await updateDoc(doc(db, "notificaciones", id), { leido: true });
  };

  return (
    <div className="container py-4" style={{ maxWidth: 900, marginTop: 32 }}>
      <h2 className="fw-bold mb-4" style={{ color: "#5C2B2B" }}>
        <FaBell className="me-2" /> Notificaciones
      </h2>
      {notificaciones.length === 0 && (
        <div className="alert alert-info">No tienes notificaciones.</div>
      )}
      <ul className="list-group">
        {notificaciones.map((n) => (
          <li
            key={n.id}
            className={`list-group-item d-flex justify-content-between align-items-center${n.leido ? '' : ' notificacion-unread'}`}
            style={{ borderRadius: 12, marginBottom: 12, cursor: n.leido ? 'default' : 'pointer' }}
            onClick={() => !n.leido && marcarLeida(n.id)}
          >
            <div>
              <div className="fw-bold" style={{ color: "#A05252" }}>
                {tipoLabels[n.tipo] || n.tipo}
              </div>
              <div>
                {n.mensaje}
                {n.cursoNombre && (
                  <span className="ms-2 badge bg-secondary">{n.cursoNombre}</span>
                )}
              </div>
              <div className="text-muted small mt-1">
                {n.fecha
                  ? (n.fecha.toDate
                      ? n.fecha.toDate().toLocaleString()
                      : new Date(n.fecha).toLocaleString())
                  : ""}
              </div>
            </div>
            {!n.leido ? (
              <button
                className="btn btn-outline-success btn-sm"
                onClick={() => marcarLeida(n.id)}
                title="Marcar como leída"
              >
                <FaCheckCircle />
              </button>
            ) : (
              <span className="text-success">
                <FaCheckCircle title="Leída" />
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Notificaciones;
