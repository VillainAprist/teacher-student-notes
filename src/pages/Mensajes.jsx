import { useEffect, useState } from 'react';
import { mensajesService } from '../services/mensajesService';
import { db } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import '../styles/mensajes.css';
import { FaInbox, FaPaperPlane, FaTrash, FaPlus } from 'react-icons/fa';

function Mensajes({ user }) {
  const [tab, setTab] = useState('recibidos');
  const [mensajes, setMensajes] = useState([]);
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [destinatario, setDestinatario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [recargar, setRecargar] = useState(false);
  const [mensajeSeleccionado, setMensajeSeleccionado] = useState(null);

  // Detecta el modo oscuro de forma reactiva
  const [isDark, setIsDark] = useState(document.body.classList.contains('dark-mode'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark-mode'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const fetchMensajes = async () => {
      if (tab === 'recibidos') {
        setMensajes(await mensajesService.obtenerMensajesRecibidos(user.uid));
      } else {
        setMensajes(await mensajesService.obtenerMensajesEnviados(user.uid));
      }
      setMensajeSeleccionado(null);
    };
    fetchMensajes();
  }, [tab, user, recargar]);

  // Buscar destinatario directamente en Firestore
  const buscarUsuarioPorNombre = async (nombre) => {
    const q = query(collection(db, 'usuarios'), where('nombre', '==', nombre));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docUser = snap.docs[0];
      return { uid: docUser.id, nombre: docUser.data().nombre };
    }
    return null;
  };

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!destinatario || !asunto || !mensaje) return;
    setEnviando(true);
    // Buscar destinatario por nombre exacto en Firestore
    const data = await buscarUsuarioPorNombre(destinatario);
    if (!data?.uid) {
      alert('Destinatario no encontrado');
      setEnviando(false);
      return;
    }
    await mensajesService.enviarMensaje({
      remitenteUid: user.uid,
      remitenteNombre: user.nombre || user.username,
      destinatarioUid: data.uid,
      destinatarioNombre: data.nombre,
      asunto,
      mensaje
    });
    setAsunto('');
    setMensaje('');
    setDestinatario('');
    setEnviando(false);
    setTab('enviados');
    setRecargar(r => !r);
  };

  // Panel tipo Outlook
  return (
    <div className="mensajes-root container mt-4" style={{maxWidth: '100vw', position: 'relative'}}>
      <h2 style={{fontFamily: 'Inter, Roboto, Open Sans, Arial, sans-serif', color: '#5C2B2B', fontWeight: 700}}>Mensajes</h2>
      <div className="d-flex" style={{minHeight: 500, border: '1.5px solid #A05252', borderRadius: 12, overflow: 'hidden', maxWidth: '1100px', margin: '0 auto', height: '700px', background: isDark ? '#18191a' : '#fff'}}>
        {/* Sidebar */}
        <div className="mensajes-sidebar">
          <ul className="list-group list-group-flush">
            <li className={`list-group-item ${tab==='recibidos' ? 'active' : ''}`} style={{cursor:'pointer'}} onClick={()=>setTab('recibidos')}><FaInbox /> Recibidos</li>
            <li className={`list-group-item ${tab==='enviados' ? 'active' : ''}`} style={{cursor:'pointer'}} onClick={()=>setTab('enviados')}><FaPaperPlane /> Enviados</li>
            {/* <li className={`list-group-item ${tab==='papelera' ? 'active' : ''}`} style={{cursor:'pointer'}} onClick={()=>setTab('papelera')}><FaTrash /> Papelera</li> */}
            <li className={`list-group-item ${tab==='nuevo' ? 'active' : ''}`} style={{cursor:'pointer'}} onClick={()=>setTab('nuevo')}><FaPlus /> Nuevo mensaje</li>
          </ul>
        </div>
        {/* Lista de mensajes */}
        <div className="mensajes-list">
          {tab === 'nuevo' ? (
            <form onSubmit={handleEnviar} className="p-4">
              <div className="mb-2">
                <label>Para (nombre exacto):</label>
                <input className="form-control" value={destinatario} onChange={e=>setDestinatario(e.target.value)} required />
              </div>
              <div className="mb-2">
                <label>Asunto:</label>
                <input className="form-control" value={asunto} onChange={e=>setAsunto(e.target.value)} required />
              </div>
              <div className="mb-2">
                <label>Mensaje:</label>
                <textarea className="form-control" value={mensaje} onChange={e=>setMensaje(e.target.value)} required />
              </div>
              <button className="btn btn-primary" type="submit" disabled={enviando}>Enviar</button>
            </form>
          ) : (
            <div>
              {mensajes.length === 0 ? <div className="p-4">No hay mensajes.</div> : (
                <table className="table table-hover mb-0">
                  <tbody>
                    {mensajes.map(m => (
                      <tr key={m.id} className={`${!m.leido && tab==='recibidos' ? 'unread' : ''} ${mensajeSeleccionado && mensajeSeleccionado.id === m.id ? 'selected' : ''}`}
                        onClick={()=>setMensajeSeleccionado(m)}>
                        <td style={{width: '30%'}}>{tab==='recibidos' ? m.remitenteNombre : m.destinatarioNombre}</td>
                        <td style={{width: '40%'}}>{m.asunto}</td>
                        <td style={{width: '30%'}}>{new Date(m.fecha.seconds*1000).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
        {/* Panel de lectura */}
        <div className="mensajes-detail">
          {mensajeSeleccionado ? (
            <div>
              <h5>{mensajeSeleccionado.asunto}</h5>
              <div className="meta">
                <div><b>De:</b> {mensajeSeleccionado.remitenteNombre}</div>
                <div><b>Para:</b> {mensajeSeleccionado.destinatarioNombre}</div>
                <div><b>Fecha:</b> {new Date(mensajeSeleccionado.fecha.seconds*1000).toLocaleString()}</div>
              </div>
              <div className="contenido">{mensajeSeleccionado.mensaje}</div>
              {tab === 'recibidos' && (
                <div className="form-check mt-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="vistoCheck"
                    checked={!!mensajeSeleccionado.leido}
                    onChange={async (e) => {
                      if (!mensajeSeleccionado.leido && e.target.checked) {
                        await mensajesService.marcarComoLeido(mensajeSeleccionado.id);
                        setMensajeSeleccionado({ ...mensajeSeleccionado, leido: true });
                        setRecargar(r => !r);
                      }
                    }}
                  />
                  <label className="form-check-label" htmlFor="vistoCheck">
                    Marcar como visto
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted">Selecciona un mensaje para ver su contenido.</div>
          )}
        </div>
      </div>
      {/* Botón flotante para nuevo mensaje */}
      <div className="mensajes-fab" title="Nuevo mensaje" onClick={()=>setTab('nuevo')}><FaPlus /></div>
    </div>
  );
}

export default Mensajes;
