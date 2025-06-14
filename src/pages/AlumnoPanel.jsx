import { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { calcularNotaFinal } from '../utils/calculoNotas';

function AlumnoPanel({ user, perfil }) {
  const [inscripciones, setInscripciones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!user?.uid) return;
      // Buscar inscripciones del alumno por UID
      const inscripcionesSnap = await getDocs(
        query(collection(db, 'inscripciones'), where('alumnoUid', '==', user.uid))
      );
      const inscripcionesData = inscripcionesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInscripciones(inscripcionesData);
      // Buscar cursos correspondientes
      const cursosData = [];
      for (const insc of inscripcionesData) {
        const cursoDoc = await getDoc(doc(db, 'cursos', insc.cursoId));
        if (cursoDoc.exists()) {
          cursosData.push({ id: cursoDoc.id, ...cursoDoc.data(), notas: insc.notas, inscripcionId: insc.id });
        }
      }
      setCursos(cursosData);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="mt-4">Cargando...</div>;

  return (
    <div className="container mt-4">
      <h2>Mis Notas</h2>
      {cursos.length === 0 ? (
        <p>No tienes cursos inscritos.</p>
      ) : (
        cursos.map((curso) => {
          const notas = curso.notas || {};
          // Calcula el promedio de prácticas (PC)
          let promedioPC = '-';
          if (notas.pc1 !== undefined && notas.pc2 !== undefined) {
            promedioPC = ((Number(notas.pc1) + Number(notas.pc2)) / 2).toFixed(2);
          } else if (notas.pc1 !== undefined) {
            promedioPC = notas.pc1;
          } else if (notas.pc2 !== undefined) {
            promedioPC = notas.pc2;
          }
          return (
            <div key={curso.id} className="card mb-3">
              <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                <span>
                  <b>{curso.nombre}</b>
                  {curso.seccion && <span className="badge bg-secondary ms-2">Sección: {curso.seccion}</span>}
                  {curso.ciclo && <span className="badge bg-info ms-2">Ciclo: {curso.ciclo}</span>}
                  {curso.escuela && <span className="badge bg-primary ms-2">{curso.escuela}</span>}
                </span>
                <span style={{fontSize:'0.95em', color:'#555'}}>
                  Profesor: <b>{curso.profesorNombre || curso.profesor || 'Sin asignar'}</b>
                  {curso.profesorEmail && <span className="ms-2" style={{fontSize:'0.9em', color:'#888'}}>{curso.profesorEmail}</span>}
                </span>
              </div>
              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>PC (Promedio)</th>
                      <th>Parcial</th>
                      <th>Final</th>
                      <th>Susti</th>
                      <th>Aplaz</th>
                      <th>Nota Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{promedioPC}</td>
                      <td>{notas.parcial ?? '-'}</td>
                      <td>{notas.final ?? '-'}</td>
                      <td>{notas.susti ?? notas.sustitutorio ?? '-'}</td>
                      <td>{notas.aplaz ?? notas.aplazado ?? '-'}</td>
                      <td>{calcularNotaFinal(notas).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default AlumnoPanel;
