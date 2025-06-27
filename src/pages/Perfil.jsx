import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import CambiarContrasena from '../components/CambiarContrasena';

function Perfil({ perfil, user, setPerfil }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [perfilAlumno, setPerfilAlumno] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAccordion, setShowAccordion] = useState(false);

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
  // Determinar el rol real del perfil mostrado:
  // Si perfilAlumno existe y tiene .role, usarlo; si no, usar user?.role
  const rol = (perfilAlumno && perfilAlumno.role) ? perfilAlumno.role : (user?.uid === id ? user?.role : null);
  const esProfesor = rol === 'profesor';

  return (
    <div className="container mt-4 d-flex justify-content-center align-items-center" style={{minHeight:'80vh'}}>
      <div className="card p-4 mb-3 shadow" style={{maxWidth: 480, width: '100%'}}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <button className="btn btn-primary me-2" onClick={() => navigate('/editar-perfil')}>Editar perfil</button>
            <button className="btn btn-outline-secondary" onClick={() => setShowAccordion(v => !v)}>
              {showAccordion ? 'Ocultar' : 'Cambiar contraseña'}
            </button>
          </div>
        </div>
        <div className="d-flex align-items-center mb-3 flex-column flex-md-row text-center text-md-start">
          {datos.imagen && datos.imagen !== '' ? (
            <img src={datos.imagen} alt="avatar" style={{width:80, height:80, borderRadius:'50%', objectFit:'cover', border:'2px solid #A05252', marginRight:16, marginBottom:12}} />
          ) : null}
          <div>
            <h4 className="mb-1">{datos.nombre || 'Sin nombre'}</h4>
            <div className="text-muted">{datos.correo || datos.email || 'Sin correo'}</div>
            <div className="text-muted">{datos.codigo || 'Sin código'}</div>
          </div>
        </div>
        <div className="mb-2">
          {rol === 'profesor' ? (
            <>
              <strong>Departamento académico:</strong> {datos.departamento || 'Sin departamento'}<br/>
              <strong>Categoría:</strong> {datos.categoria || 'Sin categoría'}<br/>
              <strong>Grado académico:</strong> {datos.grado || 'Sin grado'}<br/>
              <strong>Teléfono:</strong> {datos.telefono || 'Sin teléfono'}
            </>
          ) : rol === 'alumno' ? (
            <>
              <strong>Escuela:</strong> {datos.escuela || 'Sin escuela'}<br/>
              <strong>Sección:</strong> {datos.seccion || 'Sin sección'}<br/>
              <strong>Teléfono:</strong> {datos.telefono || 'Sin teléfono'}
            </>
          ) : (
            <>
              <strong>Teléfono:</strong> {datos.telefono || 'Sin teléfono'}
            </>
          )}
        </div>
        <strong>Descripción:</strong><br/>
        <span>{datos.masInfo || 'Sin descripción'}</span>
        {/* Acordeón para cambiar contraseña, solo si es su propio perfil */}
        {user?.uid === id && !perfilAlumno?.notFound && (
          <div className="mt-3">
            <div className={`accordion ${showAccordion ? 'show' : ''}`}> 
              {showAccordion && (
                <div className="accordion-body p-0">
                  <CambiarContrasena />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Perfil;
