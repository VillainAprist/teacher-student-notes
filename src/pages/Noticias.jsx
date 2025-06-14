import { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { FaUserCircle } from 'react-icons/fa';

const badgeColor = (rol) => {
  if (rol === 'admin') return 'bg-secondary';
  if (rol === 'profesor') return 'bg-success';
  if (rol === 'alumno') return 'bg-primary';
  return 'bg-dark';
};

function Noticias() {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnuncios = async () => {
      setLoading(true);
      const q = query(collection(db, 'anuncios'), orderBy('fecha', 'desc'));
      const snap = await getDocs(q);
      setAnuncios(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchAnuncios();
  }, []);

  return (
    <div className="container-fluid py-4" style={{marginTop: '2.5rem', minWidth: 900, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <h2 className="fw-bold mb-4" style={{ color: '#5C2B2B', fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif' }}>Noticias y Anuncios</h2>
      {loading ? <div>Cargando...</div> : (
        anuncios.length === 0 ? <div>No hay noticias aún.</div> : (
          <div className="d-flex flex-column gap-4 w-100 align-items-center">
            {anuncios.map(anuncio => (
              <div key={anuncio.id} className="shadow-sm mb-3" style={{background:'#fff', borderRadius:16, minWidth:900, maxWidth:900, width:'100%', padding:32, display:'flex', flexDirection:'column', gap:16}}>
                {/* Header */}
                <div className="d-flex align-items-center mb-2 gap-3">
                  <FaUserCircle size={48} color="#A05252" style={{marginRight:8}} />
                  <div>
                    <span className="fw-bold" style={{color:'#5C2B2B', fontSize:'1.1em'}}>{anuncio.autorNombre}</span>
                    <span className={`badge ms-2 ${badgeColor(anuncio.autorRol)}`}>{anuncio.autorRol}</span>
                    <div className="text-muted small" style={{fontFamily:'inherit'}}>{new Date(anuncio.fecha).toLocaleDateString()} {new Date(anuncio.fecha).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                </div>
                {/* Título */}
                <h5 className="fw-bold mb-2" style={{color:'#5C2B2B', fontFamily:'inherit'}}>{anuncio.titulo}</h5>
                {/* Contenido */}
                <div className="mb-3" style={{fontFamily:'inherit', fontSize:'1.08em'}}>{anuncio.contenido}</div>
                {/* Imagen */}
                {anuncio.imagenUrl && (
                  <img src={anuncio.imagenUrl} alt="anuncio" style={{width:'100%', maxHeight:400, objectFit:'cover', borderRadius:12, marginBottom:8}} />
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default Noticias;
