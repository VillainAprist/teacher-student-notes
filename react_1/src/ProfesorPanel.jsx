import Papa from 'papaparse';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ESCUELAS = [
  'Informática',
  'Mecatrónica',
  'Electrónica',
  'Telecomunicaciones'
];

function ProfesorPanel({ cursos, setCursos }) {
  const [nuevoCurso, setNuevoCurso] = useState('');
  const [nuevaEscuela, setNuevaEscuela] = useState(ESCUELAS[0]);
  const [nuevaSeccion, setNuevaSeccion] = useState('');
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [nuevoEstudiante, setNuevoEstudiante] = useState('');
  const [notas, setNotas] = useState({ pc1: '', pc2: '', parcial: '', final: '' });
  const [notasExtras, setNotasExtras] = useState([
    { nombre: 'opc1', label: 'Opc 1', valor: '' },
    { nombre: 'opc2', label: 'Opc 2', valor: '' }
  ]);
  const [busqueda, setBusqueda] = useState('');
  const [editAlumnoIdx, setEditAlumnoIdx] = useState(null);
  const [editNotas, setEditNotas] = useState({ pc1: '', pc2: '', parcial: '', final: '', extras: '' });
  const [showChartIdx, setShowChartIdx] = useState(null);
  const navigate = useNavigate();

  const handleCSV = (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
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
        const nuevosCursos = [...cursos];
        nuevosCursos[idx].estudiantes = nuevosCursos[idx].estudiantes.concat(nuevosEstudiantes);
        setCursos(nuevosCursos);
      }
    });
  };

  const agregarCurso = () => {
    if (nuevoCurso.trim() !== '' && nuevaSeccion.trim() !== '') {
      setCursos([
        ...cursos,
        {
          nombre: nuevoCurso,
          escuela: nuevaEscuela,
          seccion: nuevaSeccion,
          estudiantes: []
        }
      ]);
      setNuevoCurso('');
      setNuevaSeccion('');
      setSelectedCurso(cursos.length); // Selecciona el nuevo curso
    }
  };

  const handleNotaExtraChange = (idx, value) => {
    const nuevasNotas = [...notasExtras];
    nuevasNotas[idx].valor = value;
    setNotasExtras(nuevasNotas);
  };

  const agregarNotaExtra = () => {
    setNotasExtras([
      ...notasExtras,
      { nombre: `opc${notasExtras.length + 1}`, label: `Opc ${notasExtras.length + 1}`, valor: '' }
    ]);
  };

  const agregarEstudiante = () => {
    if (nuevoEstudiante.trim() !== '' && notas.pc1 && notas.pc2 && notas.parcial && notas.final) {
      const nuevosCursos = [...cursos];
      nuevosCursos[selectedCurso].estudiantes.push({
        nombre: nuevoEstudiante,
        notas: {
          ...notas,
          ...Object.fromEntries(notasExtras.map(n => [n.nombre, n.valor]))
        }
      });
      setCursos(nuevosCursos);
      setNuevoEstudiante('');
      setNotas({ pc1: '', pc2: '', parcial: '', final: '' });
      setNotasExtras([
        { nombre: 'opc1', label: 'Opc 1', valor: '' },
        { nombre: 'opc2', label: 'Opc 2', valor: '' }
      ]);
    }
  };

  const handleSelectCurso = (idx) => {
    setSelectedCurso(idx);
    setShowChartIdx(null);
  };

  const estudiantesFiltrados = selectedCurso !== null ? cursos[selectedCurso].estudiantes.filter(est => est.nombre.toLowerCase().includes(busqueda.toLowerCase())) : [];

  return (
    <div className="container mt-4">
      <h2>Gestión de Cursos Universitarios</h2>
      <div className="mb-3">
        <label className="form-label">Crear nuevo curso:</label>
        <div className="row g-2 mb-2">
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="Nombre del curso (ej: Matemática 2)"
              value={nuevoCurso}
              onChange={e => setNuevoCurso(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <select className="form-select" value={nuevaEscuela} onChange={e => setNuevaEscuela(e.target.value)}>
              {ESCUELAS.map(esc => <option key={esc} value={esc}>{esc}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <input
              type="text"
              className="form-control"
              placeholder="Sección"
              value={nuevaSeccion}
              onChange={e => setNuevaSeccion(e.target.value)}
            />
          </div>
          <div className="col-md-2 d-grid">
            <button className="btn btn-success" onClick={agregarCurso}>Agregar Curso</button>
          </div>
        </div>
      </div>
      <div className="row" style={{ marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0 }}>
        <div className="col-md-3" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <ul className="list-group">
            {cursos.map((curso, idx) => (
              <li key={idx} className={`list-group-item d-flex justify-content-between align-items-center ${selectedCurso === idx ? 'active' : ''}`}
                onClick={() => handleSelectCurso(idx)} style={{ cursor: 'pointer', marginBottom: 10, padding: '16px 12px' }}>
                <div>
                  <strong>{curso.nombre}</strong>
                  <div style={{ fontSize: '0.9em' }}>
                    {curso.escuela} - Sección {curso.seccion}
                  </div>
                </div>
                <div>
                  <label className="btn btn-outline-primary btn-sm mb-0 me-2">
                    Importar CSV
                    <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleCSV(e, idx)} />
                  </label>
                  <button className="btn btn-outline-success btn-sm" type="button" onClick={e => { e.stopPropagation(); setShowChartIdx(idx === showChartIdx ? null : idx); }}>Ver Gráfica</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-9" style={{ paddingLeft: 0, paddingRight: 0 }}>
          {showChartIdx !== null && cursos[showChartIdx] && selectedCurso === showChartIdx && (
            <div className="mb-4">
              <h5 className="mb-3">Desempeño de estudiantes en {cursos[showChartIdx].nombre}</h5>
              <Bar
                data={{
                  labels: cursos[showChartIdx].estudiantes.map(e => e.nombre),
                  datasets: [
                    {
                      label: 'Nota Final',
                      backgroundColor: '#A05252',
                      data: cursos[showChartIdx].estudiantes.map(est => {
                        const promedioPC = (+est.notas.pc1 + +est.notas.pc2) / 2;
                        let sumaExtras = 0;
                        if (est.notas) {
                          Object.keys(est.notas).forEach(k => {
                            if (k.startsWith('opc')) sumaExtras += +est.notas[k] || 0;
                          });
                        }
                        return (promedioPC * 0.4) + (+est.notas.parcial * 0.3) + (+est.notas.final * 0.3) + sumaExtras;
                      })
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Notas Finales' }
                  },
                  scales: {
                    y: { beginAtZero: true, max: 20 }
                  }
                }}
                height={120}
              />
            </div>
          )}
          {selectedCurso !== null && (
            <div>
              <h4>Estudiantes en {cursos[selectedCurso].nombre}</h4>
              <div className="card mb-4 p-3">
                <div className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nombre del estudiante"
                    value={nuevoEstudiante}
                    onChange={e => setNuevoEstudiante(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'ArrowRight' || e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('input-pc1')?.focus();
                      }
                    }}
                  />
                  <input
                    id="input-pc1"
                    type="number"
                    className="form-control"
                    placeholder="PC1"
                    value={notas.pc1}
                    onChange={e => setNotas({ ...notas, pc1: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        document.querySelector('input[placeholder=\'Nombre del estudiante\']')?.focus();
                      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('input-pc2')?.focus();
                      }
                    }}
                  />
                  <input
                    id="input-pc2"
                    type="number"
                    className="form-control"
                    placeholder="PC2"
                    value={notas.pc2}
                    onChange={e => setNotas({ ...notas, pc2: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        document.getElementById('input-pc1')?.focus();
                      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('input-parcial')?.focus();
                      }
                    }}
                  />
                  <input
                    id="input-parcial"
                    type="number"
                    className="form-control"
                    placeholder="Parcial"
                    value={notas.parcial}
                    onChange={e => setNotas({ ...notas, parcial: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        document.getElementById('input-pc2')?.focus();
                      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('input-final')?.focus();
                      }
                    }}
                  />
                  <input
                    id="input-final"
                    type="number"
                    className="form-control"
                    placeholder="Final"
                    value={notas.final}
                    onChange={e => setNotas({ ...notas, final: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        document.getElementById('input-parcial')?.focus();
                      } else if ((e.key === 'ArrowRight' || e.key === 'Enter') && document.getElementById('input-opc1')) {
                        e.preventDefault();
                        document.getElementById('input-opc1')?.focus();
                      }
                    }}
                  />
                  {notasExtras.map((nota, idx) => (
                    <input
                      key={nota.nombre}
                      id={`input-${nota.nombre}`}
                      type="number"
                      className="form-control"
                      placeholder={nota.label}
                      value={nota.valor}
                      onChange={e => handleNotaExtraChange(idx, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'ArrowLeft') {
                          e.preventDefault();
                          if (idx === 0) {
                            document.getElementById('input-final')?.focus();
                          } else {
                            document.getElementById(`input-${notasExtras[idx-1].nombre}`)?.focus();
                          }
                        } else if ((e.key === 'ArrowRight' || e.key === 'Enter') && idx < notasExtras.length - 1) {
                          e.preventDefault();
                          document.getElementById(`input-${notasExtras[idx+1].nombre}`)?.focus();
                        }
                      }}
                    />
                  ))}
                  <button className="btn btn-secondary" type="button" onClick={agregarNotaExtra}>+ Nota Extra</button>
                  <button className="btn btn-primary" onClick={() => {
                    if (nuevoEstudiante.trim() !== '' && notas.pc1 && notas.pc2 && notas.parcial && notas.final) {
                      const nuevosCursos = [...cursos];
                      nuevosCursos[selectedCurso].estudiantes.push({
                        nombre: nuevoEstudiante,
                        notas: {
                          ...notas,
                          ...Object.fromEntries(notasExtras.map(n => [n.nombre, n.valor]))
                        }
                      });
                      setCursos(nuevosCursos);
                      setNuevoEstudiante('');
                      setNotas({ pc1: '', pc2: '', parcial: '', final: '' });
                      setNotasExtras([
                        { nombre: 'opc1', label: 'Opc 1', valor: '' },
                        { nombre: 'opc2', label: 'Opc 2', valor: '' }
                      ]);
                    }
                  }}>Agregar Estudiante</button>
                </div>
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
                    {notasExtras.map((nota, idx) => (
                      <th key={nota.nombre}>{nota.label}</th>
                    ))}
                    <th>Nota Final</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantesFiltrados.map((est, i) => {
                    const promedioPC = (+est.notas.pc1 + +est.notas.pc2) / 2;
                    let sumaExtras = 0;
                    notasExtras.forEach(nota => {
                      sumaExtras += +est.notas[nota.nombre] || 0;
                    });
                    const notaFinal = (promedioPC * 0.4) + (+est.notas.parcial * 0.3) + (+est.notas.final * 0.3) + sumaExtras;
                    return editAlumnoIdx === i ? (
                      <tr key={i}>
                        <td>{est.nombre}</td>
                        <td><input type="number" className="form-control" value={editNotas.pc1} onChange={e => setEditNotas({ ...editNotas, pc1: e.target.value })} /></td>
                        <td><input type="number" className="form-control" value={editNotas.pc2} onChange={e => setEditNotas({ ...editNotas, pc2: e.target.value })} /></td>
                        <td><input type="number" className="form-control" value={editNotas.parcial} onChange={e => setEditNotas({ ...editNotas, parcial: e.target.value })} /></td>
                        <td><input type="number" className="form-control" value={editNotas.final} onChange={e => setEditNotas({ ...editNotas, final: e.target.value })} /></td>
                        {notasExtras.map((nota, idx) => (
                          <td key={nota.nombre}><input type="number" className="form-control" value={editNotas[nota.nombre]} onChange={e => setEditNotas({ ...editNotas, [nota.nombre]: e.target.value })} /></td>
                        ))}
                        <td>{notaFinal.toFixed(2)}</td>
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
                        <td>
                          <span
                            style={{ color: '#A05252', cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => navigate(`/perfil/${encodeURIComponent(est.nombre)}`)}
                          >
                            {est.nombre}
                          </span>
                        </td>
                        <td>{est.notas.pc1}</td>
                        <td>{est.notas.pc2}</td>
                        <td>{est.notas.parcial}</td>
                        <td>{est.notas.final}</td>
                        {notasExtras.map((nota, idx) => (
                          <td key={nota.nombre}>{est.notas[nota.nombre]}</td>
                        ))}
                        <td>{notaFinal.toFixed(2)}</td>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfesorPanel;
