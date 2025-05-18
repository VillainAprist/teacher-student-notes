import { useNavigate } from 'react-router-dom';
import { db } from './firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';

function AlumnoPanel({ cursos, alumno, perfil }) {
  const navigate = useNavigate();
  const [cursosDB, setCursosDB] = useState([]);

  useEffect(() => {
    const fetchCursos = async () => {
      const cursosCol = collection(db, 'cursos');
      const cursosSnapshot = await getDocs(cursosCol);
      const cursosData = cursosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filtra solo los cursos donde el alumno está inscrito
      const cursosAlumno = cursosData.filter(curso =>
        curso.estudiantes && curso.estudiantes.some(e => e.nombre === alumno || e.email === alumno)
      );
      setCursosDB(cursosAlumno);
    };
    fetchCursos();
  }, [alumno]);

  const cursosToShow = cursosDB.length ? cursosDB : cursos;

  return (
    <div className="container mt-4">
      <h2>Mis Notas</h2>
      {cursosToShow.length === 0 ? (
        <p>No hay cursos disponibles.</p>
      ) : (
        cursosToShow.map((curso, idx) => {
          const estudiante = curso.estudiantes.find(e => e.nombre === alumno);
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
                        <td>{estudiante.notas.pc1}</td>
                        <td>{estudiante.notas.pc2}</td>
                        <td>{estudiante.notas.parcial}</td>
                        <td>{estudiante.notas.final}</td>
                        <td>{Object.keys(estudiante.notas)
                          .filter(k => k.startsWith('opc'))
                          .map(k => estudiante.notas[k])
                          .join(', ')}</td>
                        <td>{(() => {
                          const pc1 = +estudiante.notas.pc1 || 0;
                          const pc2 = +estudiante.notas.pc2 || 0;
                          const parcial = +estudiante.notas.parcial || 0;
                          const final = +estudiante.notas.final || 0;
                          const promedioPC = (pc1 + pc2) / 2;
                          let sumaExtras = 0;
                          Object.keys(estudiante.notas).forEach(k => {
                            if (k.startsWith('opc') && estudiante.notas[k] !== undefined && estudiante.notas[k] !== '') {
                              sumaExtras += +estudiante.notas[k] || 0;
                            }
                          });
                          return ((promedioPC * 0.4) + (parcial * 0.3) + (final * 0.3) + sumaExtras).toFixed(2);
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
