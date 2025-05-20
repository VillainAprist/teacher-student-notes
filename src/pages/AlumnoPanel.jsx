import { useNavigate } from 'react-router-dom';
import { useCursosAlumno } from '../hooks/useCursosAlumno';
import { useState } from 'react';

function AlumnoPanel({ user, perfil }) {
  const navigate = useNavigate();
  // Usar el uid del usuario autenticado
  const alumnoId = user?.uid;
  const { cursos, loading } = useCursosAlumno(alumnoId);

  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <div>Cargando cursos...</div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2>Mis Notas</h2>
      {cursos.length === 0 ? (
        <p>No hay cursos disponibles.</p>
      ) : (
        cursos.map((curso, idx) => {
          // Buscar al estudiante en el array de estudiantes del curso por uid, nombre, email o código
          const estudiante = curso.estudiantes?.find(e =>
            e.uid === alumnoId ||
            e.nombre === user?.nombre ||
            e.email === user?.email ||
            e.codigo === perfil?.codigo
          );
          return (
            <div key={idx} className="card mb-3">
              <div className="card-header">{curso.nombre}</div>
              <div className="card-body">
                {estudiante ? (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>PC1</th>
                        <th>PC2</th>
                        <th>Parcial</th>
                        <th>Final</th>
                        <th>Extras</th>
                        <th>Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <span style={{display:'flex', alignItems:'center', gap:8}}>
                            {perfil?.imagen && (
                              <img src={perfil.imagen} alt="avatar" style={{width:28, height:28, borderRadius:'50%', objectFit:'cover', border:'1.5px solid #A05252'}} />
                            )}
                            <span
                              style={{color:'#A05252', cursor:'pointer', textDecoration:'underline'}}
                              onClick={() => navigate(`/perfil/${encodeURIComponent(estudiante.nombre)}`)}
                            >
                              {estudiante.nombre}
                            </span>
                          </span>
                        </td>
                        <td>{estudiante.notas?.pc1 ?? ''}</td>
                        <td>{estudiante.notas?.pc2 ?? ''}</td>
                        <td>{estudiante.notas?.parcial ?? ''}</td>
                        <td>{estudiante.notas?.final ?? ''}</td>
                        {/* Mostrar promedio de extras o '-' si no hay extras */}
                        <td>{(() => {
                          const extrasKeys = Object.keys(estudiante.notas || {}).filter(k => k.startsWith('opc'));
                          if (extrasKeys.length === 0) return '-';
                          const extrasValues = extrasKeys.map(k => +estudiante.notas[k] || 0);
                          const promedioExtras = extrasValues.reduce((a, b) => a + b, 0) / extrasValues.length;
                          return promedioExtras.toFixed(2);
                        })()}</td>
                        <td>{(() => {
                          const notas = estudiante.notas || {};
                          const pc1 = +notas.pc1 || 0;
                          const pc2 = +notas.pc2 || 0;
                          const parcial = +notas.parcial || 0;
                          const final = +notas.final || 0;
                          // Calcular extras igual que en ProfesorPanel
                          const extrasKeys = Object.keys(notas).filter(k => k.startsWith('opc') && notas[k] !== '' && !isNaN(notas[k]));
                          let promedioExtras = 0;
                          if (extrasKeys.length > 0) {
                            promedioExtras = extrasKeys.reduce((acc, k) => acc + (+notas[k] || 0), 0) / extrasKeys.length;
                          }
                          let promedioPC = 0;
                          if (extrasKeys.length > 0) {
                            promedioPC = ((pc1 + pc2) / 2) * 0.5 + promedioExtras * 0.5;
                          } else {
                            promedioPC = (pc1 + pc2) / 2;
                          }
                          let notaFinal = (promedioPC * 0.4) + (parcial * 0.3) + (final * 0.3);
                          if (notaFinal > 20) notaFinal = 20;
                          return notaFinal.toFixed(2);
                        })()}</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p>No estás inscrito en este curso.</p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default AlumnoPanel;
