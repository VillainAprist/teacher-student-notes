import Papa from 'papaparse';
import { useState } from 'react';

function ProfesorPanel({ cursos, setCursos }) {
  const [nuevoCurso, setNuevoCurso] = useState('');
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [nuevoEstudiante, setNuevoEstudiante] = useState('');
  const [notas, setNotas] = useState({ pc1: '', pc2: '', parcial: '', final: '', extras: '' });
  const [busqueda, setBusqueda] = useState('');
  const [showCSV, setShowCSV] = useState(false);
  const [editAlumnoIdx, setEditAlumnoIdx] = useState(null);
  const [editNotas, setEditNotas] = useState({ pc1: '', pc2: '', parcial: '', final: '', extras: '' });

  // Estructura de cursos: [{ nombre: 'Matemática 2', estudiantes: [{ nombre: 'Juan', notas: {pc1: 15, pc2: 18, parcial: 17, final: 19, extras: 2}}] }]

  const handleCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Espera columnas: nombre, pc1, pc2, parcial, final, extras
        const nuevosEstudiantes = results.data.map(row => ({
          nombre: row.nombre,
          notas: {
            pc1: row.pc1,
            pc2: row.pc2,
            parcial: row.parcial,
            final: row.final,
            extras: row.extras || 0
          }
        }));
        if (selectedCurso !== null) {
          const nuevosCursos = [...cursos];
          nuevosCursos[selectedCurso].estudiantes = nuevosCursos[selectedCurso].estudiantes.concat(nuevosEstudiantes);
          setCursos(nuevosCursos);
        } else if (nuevoCurso.trim() !== '') {
          setCursos([...cursos, { nombre: nuevoCurso, estudiantes: nuevosEstudiantes }]);
          setNuevoCurso('');
        }
        setShowCSV(false);
      }
    });
  };

  const seleccionarCurso = (idx) => {
    setSelectedCurso(idx);
  };

  const agregarEstudiante = () => {
    if (nuevoEstudiante.trim() !== '' && notas.pc1 && notas.pc2 && notas.parcial && notas.final) {
      const nuevosCursos = [...cursos];
      nuevosCursos[selectedCurso].estudiantes.push({
        nombre: nuevoEstudiante,
        notas: { ...notas }
      });
      setCursos(nuevosCursos);
      setNuevoEstudiante('');
      setNotas({ pc1: '', pc2: '', parcial: '', final: '', extras: '' });
    }
  };

  const estudiantesFiltrados = selectedCurso !== null ? cursos[selectedCurso].estudiantes.filter(est => est.nombre.toLowerCase().includes(busqueda.toLowerCase())) : [];

  return (
    <div className="container mt-4">
      <h2>Gestión de Cursos Universitarios</h2>
      <div className="mb-3">
        <label className="form-label">Crear nuevo curso manualmente:</label>
        <div className="input-group mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Nombre del curso (ej: Matemática 2)"
            value={nuevoCurso}
            onChange={e => setNuevoCurso(e.target.value)}
          />
          <button className="btn btn-success" onClick={() => {
            if (nuevoCurso.trim() !== '') {
              setCursos([...cursos, { nombre: nuevoCurso, estudiantes: [] }]);
              setNuevoCurso('');
            }
          }}>Agregar Curso</button>
        </div>
        <button className="btn btn-outline-primary" onClick={() => setShowCSV(!showCSV)}>
          {showCSV ? 'Ocultar carga por CSV' : 'Cargar estudiantes y notas desde CSV'}
        </button>
        {showCSV && (
          <div className="mt-2">
            <input type="file" accept=".csv" className="form-control" onChange={handleCSV} />
            <small className="text-muted">Formato: nombre,pc1,pc2,parcial,final,extras</small>
          </div>
        )}
      </div>
      <div className="row">
        <div className="col-md-5">
          <ul className="list-group">
            {cursos.map((curso, idx) => (
              <li key={idx} className={`list-group-item d-flex justify-content-between align-items-center ${selectedCurso === idx ? 'active' : ''}`}
                onClick={() => seleccionarCurso(idx)} style={{ cursor: 'pointer' }}>
                {curso.nombre}
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-7">
          {selectedCurso !== null && (
            <div>
              <h4>Estudiantes en {cursos[selectedCurso].nombre}</h4>
              <div className="input-group mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre del estudiante"
                  value={nuevoEstudiante}
                  onChange={e => setNuevoEstudiante(e.target.value)}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="PC1"
                  value={notas.pc1}
                  onChange={e => setNotas({ ...notas, pc1: e.target.value })}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="PC2"
                  value={notas.pc2}
                  onChange={e => setNotas({ ...notas, pc2: e.target.value })}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Parcial"
                  value={notas.parcial}
                  onChange={e => setNotas({ ...notas, parcial: e.target.value })}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Final"
                  value={notas.final}
                  onChange={e => setNotas({ ...notas, final: e.target.value })}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Puntos extras"
                  value={notas.extras}
                  onChange={e => setNotas({ ...notas, extras: e.target.value })}
                />
                <button className="btn btn-primary" onClick={agregarEstudiante}>Agregar Estudiante</button>
              </div>
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar estudiante..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                />
              </div>
              <table className="table table-bordered mt-3">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>PC1</th>
                    <th>PC2</th>
                    <th>Parcial</th>
                    <th>Final</th>
                    <th>Extras</th>
                    <th>Promedio</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCurso !== null && cursos[selectedCurso].estudiantes.filter(est => est.nombre.toLowerCase().includes(busqueda.toLowerCase())).map((est, i) => {
                    const promedio = ((+est.notas.pc1 + +est.notas.pc2 + +est.notas.parcial + +est.notas.final + (+est.notas.extras || 0)) / 5).toFixed(2);
                    return editAlumnoIdx === i ? (
                      <tr key={i}>
                        <td>{est.nombre}</td>
                        <td><input type="number" className="form-control" value={editNotas.pc1} onChange={e => setEditNotas({ ...editNotas, pc1: e.target.value })} /></td>
                        <td><input type="number" className="form-control" value={editNotas.pc2} onChange={e => setEditNotas({ ...editNotas, pc2: e.target.value })} /></td>
                        <td><input type="number" className="form-control" value={editNotas.parcial} onChange={e => setEditNotas({ ...editNotas, parcial: e.target.value })} /></td>
                        <td><input type="number" className="form-control" value={editNotas.final} onChange={e => setEditNotas({ ...editNotas, final: e.target.value })} /></td>
                        <td><input type="number" className="form-control" value={editNotas.extras} onChange={e => setEditNotas({ ...editNotas, extras: e.target.value })} /></td>
                        <td>{((+editNotas.pc1 + +editNotas.pc2 + +editNotas.parcial + +editNotas.final + (+editNotas.extras || 0)) / 5).toFixed(2)}</td>
                        <td>
                          <button className="btn btn-success btn-sm me-1" onClick={() => {
                            const nuevosCursos = [...cursos];
                            nuevosCursos[selectedCurso].estudiantes[i].notas = { ...editNotas };
                            setCursos(nuevosCursos);
                            setEditAlumnoIdx(null);
                          }}>Guardar</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditAlumnoIdx(null)}>Cancelar</button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={i}>
                        <td>{est.nombre}</td>
                        <td>{est.notas.pc1}</td>
                        <td>{est.notas.pc2}</td>
                        <td>{est.notas.parcial}</td>
                        <td>{est.notas.final}</td>
                        <td>{est.notas.extras}</td>
                        <td>{promedio}</td>
                        <td>
                          <button className="btn btn-warning btn-sm" onClick={() => {
                            setEditAlumnoIdx(i);
                            setEditNotas({ ...est.notas });
                          }}>Editar</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="alert alert-info mt-3">
                <strong>Funcionalidades sugeridas para el futuro:</strong>
                <ul>
                  <li>Edición y eliminación de estudiantes y notas.</li>
                  <li>Exportar notas a Excel/CSV.</li>
                  <li>Resumen de promedios por curso.</li>
                  <li>Gráficas de rendimiento.</li>
                  <li>Mensajes o comentarios para alumnos.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfesorPanel;
