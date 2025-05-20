import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

function Perfil({ perfil, user, setPerfil }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [perfilAlumno, setPerfilAlumno] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDoc(doc(db, 'usuarios', id)).then(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPerfilAlumno(data);
        // If viewing own profile, update app state too
        if (user?.uid === id && setPerfil) {
          setPerfil({
            nombre: data.nombre || user.nombre || user.username,
            correo: data.email || user.email || '',
            telefono: data.telefono || '',
            escuela: data.escuela || '',
            seccion: data.seccion || '',
            imagen: data.imagen || '',
            codigo: data.codigo || user.codigo || ''
          });
        }
      } else {
        setPerfilAlumno({ notFound: true });
      }
      setLoading(false);
    });
  }, [id, user?.uid, setPerfil, user]);

  if (loading) return <div className="container mt-4">Cargando perfil...</div>;
  if (perfilAlumno?.notFound) return <div className="container mt-4">Perfil no encontrado.</div>;

  const datos = perfilAlumno || perfil;

  return (
    <div className="container mt-4">
      <h2>Perfil</h2>
      <div className="card p-4 mb-3">
        <div className="d-flex align-items-center mb-3">
          <img src={datos.imagen} alt="avatar" style={{width:80, height:80, borderRadius:'50%', objectFit:'cover', border:'2px solid #A05252', marginRight:16}} />
          <div>
            <h4 className="mb-1">{datos.nombre}</h4>
            <div className="text-muted">{datos.correo || datos.email}</div>
            <div className="text-muted">{datos.codigo}</div>
          </div>
        </div>
        <div className="mb-2">
          <strong>Escuela:</strong> {datos.escuela}<br/>
          <strong>Sección:</strong> {datos.seccion}<br/>
          <strong>Teléfono:</strong> {datos.telefono}
        </div>
        <strong>Descripción:</strong><br/>
        <span>{datos.masInfo || 'Sin descripción'}</span>
        {/* Mostrar botón solo si el perfil es el del usuario autenticado */}
        {user?.uid === id && !perfilAlumno?.notFound && (
          <div className="mt-3">
            <button className="btn btn-primary" onClick={() => navigate('/editar-perfil')}>Editar perfil</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Perfil;
