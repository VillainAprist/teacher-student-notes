// Importaciones de librerías externas
import Papa from 'papaparse';
import { useState, useRef } from 'react';
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

// Importaciones de servicios internos
import { db } from '../services/firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useCursos } from '../hooks/useCursos';
import { calcularNotaFinal } from '../utils/calculoNotas';
import { cursosService } from '../services/cursosService';

// Importaciones de componentes internos
import AgregarEstudianteForm from '../components/AgregarEstudianteForm';
import EstudiantesTabla from '../components/EstudiantesTabla';

// Registro de componentes de ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Constantes
const ESCUELAS = [
  'Informática',
  'Mecatrónica',
  'Electrónica',
  'Telecomunicaciones'
];

function ProfesorPanel({ cursos, setCursos, user }) {
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
  const [showChartIdx, setShowChartIdx] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [errorEstudiante, setErrorEstudiante] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef();

  // Usa el hook para obtener los cursos del profesor
  const cursosDB = useCursos({ profesorEmail: user?.email });

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
            ...Object.fromEntries(Object.keys(row).filter(k => k.startsWith('opc')).map(k => [k, row[k]]))
          }
        }));
        const nuevosCursos = [...cursosDB];
        nuevosCursos[idx].estudiantes = nuevosCursos[idx].estudiantes.concat(nuevosEstudiantes);
        setCursos(nuevosCursos);
        setPendingChanges(true);
      }
    });
  };

  // Guardar nuevo curso en Firestore
  const agregarCurso = async () => {
    if (nuevoCurso.trim() !== '' && nuevaSeccion.trim() !== '') {
      await cursosService.agregarCurso({
        nombre: nuevoCurso,
        escuela: nuevaEscuela,
        seccion: nuevaSeccion,
        profesor: user.email,
        profesorUid: user.uid
      });
      setNuevoCurso('');
      setNuevaSeccion('');
      setSelectedCurso(null);
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

  // Guardar estudiantes y notas localmente al agregar estudiante
  const agregarEstudiante = async () => {
    setErrorEstudiante('');
    if (nuevoEstudiante.trim() !== '' && notas.pc1 && notas.pc2 && notas.parcial && notas.final) {
      // Buscar el usuario en la colección usuarios
      let usuarioSnap = await cursosService.buscarUsuarioPorCampo('nombre', nuevoEstudiante);
      if (!usuarioSnap) usuarioSnap = await cursosService.buscarUsuarioPorCampo('email', nuevoEstudiante);
      if (!usuarioSnap) usuarioSnap = await cursosService.buscarUsuarioPorCampo('codigo', nuevoEstudiante);
      let uid = '';
      let email = '';
      let codigo = '';
      if (usuarioSnap) {
        uid = usuarioSnap.id;
        email = usuarioSnap.data().email || '';
        codigo = usuarioSnap.data().codigo || '';
      }
      if (!uid) {
        setErrorEstudiante('El estudiante no está registrado. Debe crear su cuenta primero.');
        return;
      }
      const nuevosCursos = [...cursosDB];
      // Convierte todas las notas a número antes de guardar
      const notasNumericas = {
        pc1: notas.pc1 !== '' ? String(Number(notas.pc1)) : '0',
        pc2: notas.pc2 !== '' ? String(Number(notas.pc2)) : '0',
        parcial: notas.parcial !== '' ? String(Number(notas.parcial)) : '0',
        final: notas.final !== '' ? String(Number(notas.final)) : '0',
        ...Object.fromEntries(notasExtras.map(n => [n.nombre, n.valor !== '' ? String(Number(n.valor)) : '0']))
      };
      nuevosCursos[selectedCurso].estudiantes.push({
        nombre: nuevoEstudiante,
        uid,
        email,
        codigo,
        notas: notasNumericas
      });
      setCursos(nuevosCursos);
      setPendingChanges(true);
      setNuevoEstudiante('');
      setNotas({ pc1: '', pc2: '', parcial: '', final: '' });
      setNotasExtras([
        { nombre: 'opc1', label: 'Opc 1', valor: '' },
        { nombre: 'opc2', label: 'Opc 2', valor: '' }
      ]);
      // --- NUEVO: Crear inscripción en la colección 'inscripciones' ---
      try {
        if (cursosDB[selectedCurso]?.id && uid) {
          await cursosService.crearInscripcion({
            cursoId: cursosDB[selectedCurso].id,
            alumnoUid: uid,
            alumnoEmail: email,
            alumnoCodigo: codigo
          });
        }
      } catch (err) {
        // Puedes mostrar un mensaje de error si lo deseas
        console.error('Error al crear inscripción:', err);
      }
    }
  };

  const handleSelectCurso = (idx) => {
    setSelectedCurso(idx);
    setShowChartIdx(null);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const guardarNotasEditadas = async (i) => {
    const nuevosCursos = [...cursosDB];
    nuevosCursos[selectedCurso].estudiantes[i].notas = { ...editNotas };
    setCursos(nuevosCursos);
    setPendingChanges(true);
  };

  const eliminarEstudiante = async (i) => {
    const nuevosCursos = [...cursosDB];
    nuevosCursos[selectedCurso].estudiantes.splice(i, 1);
    setCursos(nuevosCursos);
    setPendingChanges(true);
  };

  const guardarCambios = async () => {
    if (selectedCurso === null || !cursosDB[selectedCurso].id) return;
    await cursosService.actualizarEstudiantes(
      cursosDB[selectedCurso].id,
      cursosDB[selectedCurso].estudiantes
    );
    setPendingChanges(false);
  };

  const eliminarCurso = async (idx) => {
    const curso = cursosDB[idx];
    if (!curso.id) return;
    if (window.confirm('¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.')) {
      await cursosService.eliminarCurso(curso.id);
      const nuevosCursos = cursosDB.filter((_, i) => i !== idx);
      setCursos(nuevosCursos);
      // Si el curso eliminado era el seleccionado, deselecciona
      if (selectedCurso === idx) setSelectedCurso(null);
    }
  };

  const estudiantesFiltrados = selectedCurso !== null ? cursosDB[selectedCurso].estudiantes.filter(est => est.nombre.toLowerCase().includes(busqueda.toLowerCase())) : [];

  // Función para buscar y navegar al perfil del estudiante
  const handleVerPerfilAlumno = async (nombre, codigo, uid) => {
    if (uid) {
      navigate(`/perfil/${uid}`);
      return;
    }
    // Fallback: buscar por nombre o código en la colección de usuarios/alumnos
    const alumnosRef = collection(db, 'alumnos');
    const q = query(alumnosRef, where('nombre', '==', nombre));
    const q2 = query(alumnosRef, where('codigo', '==', codigo));
    let alumnoDoc = null;
    const snapshotNombre = await getDocs(q);
    if (!snapshotNombre.empty) {
      alumnoDoc = snapshotNombre.docs[0];
    } else {
      const snapshotCodigo = await getDocs(q2);
      if (!snapshotCodigo.empty) {
        alumnoDoc = snapshotCodigo.docs[0];
      }
    }
    if (alumnoDoc) {
      navigate(`/perfil/${encodeURIComponent(alumnoDoc.id)}`);
    } else {
      alert('Perfil no encontrado para este alumno.');
    }
  };

  const handleExportCSV = () => {
    if (selectedCurso === null) return;
    const estudiantes = cursosDB[selectedCurso].estudiantes || [];
    // Solo exportar estudiantes registrados (con uid)
    const estudiantesRegistrados = estudiantes.filter(est => est.uid && est.uid !== '');
    if (estudiantesRegistrados.length === 0) {
      alert('No hay estudiantes registrados para exportar.');
      return;
    }
    // Construir columnas dinámicamente
    const baseColumns = ['nombre', 'email', 'codigo', 'pc1', 'pc2', 'parcial', 'final'];
    const extrasColumns = notasExtras.map(n => n.nombre);
    const allColumns = [...baseColumns, ...extrasColumns];
    // Construir datos para exportar
    const data = estudiantesRegistrados.map(est => {
      const row = {
        nombre: est.nombre || '',
        email: est.email || '',
        codigo: est.codigo || '',
        pc1: est.notas?.pc1 || '',
        pc2: est.notas?.pc2 || '',
        parcial: est.notas?.parcial || '',
        final: est.notas?.final || ''
      };
      extrasColumns.forEach(col => {
        row[col] = est.notas?.[col] || '';
      });
      row.notaFinal = calcularNotaFinal(est.notas, notasExtras).toFixed(2);
      return row;
    });
    const csv = Papa.unparse({ fields: allColumns, data });
    // Descargar el archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${cursosDB[selectedCurso].nombre || 'curso'}_estudiantes.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
            {cursosDB.map((curso, idx) => (
              <li key={idx} className={`list-group-item d-flex justify-content-between align-items-center ${selectedCurso === idx ? 'active' : ''}`}
                onClick={() => handleSelectCurso(idx)} style={{ cursor: 'pointer', marginBottom: 10, padding: '16px 12px' }}>
                <div>
                  <strong>{curso.nombre}</strong>
                  <div style={{ fontSize: '0.9em' }}>
                    {curso.escuela} - Sección {curso.seccion}
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <label className="btn btn-outline-primary btn-sm mb-0 p-1" title="Importar CSV" style={{minWidth:32, minHeight:32, display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5-.5h4.5V2.5a.5.5 0 0 1 1 0v6.9h4.5a.5.5 0 0 1 0 1H6.5v6.1a.5.5 0 0 1-1 0V10.9H1a.5.5 0 0 1-.5-.5z"/></svg>
                    <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleCSV(e, idx)} />
                  </label>
                  <button className="btn btn-outline-success btn-sm p-1" type="button" title="Ver Gráfica" style={{minWidth:32, minHeight:32, display:'flex',alignItems:'center',justifyContent:'center'}} onClick={e => { e.stopPropagation(); setShowChartIdx(idx === showChartIdx ? null : idx); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M0 0h1v15h15v1H0V0zm13 13V7h-2v6h2zm-3 0V3h-2v10h2zm-3 0V9H5v4h2z"/></svg>
                  </button>
                  <button className="btn btn-outline-danger btn-sm p-1" type="button" title="Eliminar" style={{minWidth:32, minHeight:32, display:'flex',alignItems:'center',justifyContent:'center'}} onClick={e => { e.stopPropagation(); eliminarCurso(idx); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-9" style={{ paddingLeft: 0, paddingRight: 0 }}>
          {showChartIdx !== null && cursosDB[showChartIdx] && selectedCurso === showChartIdx && (
            <div className="mb-4">
              <h5 className="mb-3">Desempeño de estudiantes en {cursosDB[showChartIdx].nombre}</h5>
              <Bar
                data={{
                  labels: cursosDB[showChartIdx].estudiantes.map(e => e.nombre),
                  datasets: [
                    {
                      label: 'Nota Final',
                      backgroundColor: '#A05252',
                      data: cursosDB[showChartIdx].estudiantes.map(est => {
                        const pc1 = +est.notas.pc1 || 0;
                        const pc2 = +est.notas.pc2 || 0;
                        const extrasKeys = Object.keys(est.notas).filter(k => k.startsWith('opc') && est.notas[k] !== '' && !isNaN(est.notas[k]));
                        let promedioExtras = 0;
                        if (extrasKeys.length > 0) {
                          promedioExtras = extrasKeys.reduce((acc, k) => acc + (+est.notas[k] || 0), 0) / extrasKeys.length;
                        }
                        let promedioPC = 0;
                        if (extrasKeys.length > 0) {
                          promedioPC = ((pc1 + pc2) / 2) * 0.5 + promedioExtras * 0.5;
                        } else {
                          promedioPC = (pc1 + pc2) / 2;
                        }
                        let notaFinal = (promedioPC * 0.4) + ((+est.notas.parcial || 0) * 0.3) + ((+est.notas.final || 0) * 0.3);
                        if (notaFinal > 20) notaFinal = 20;
                        return notaFinal;
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
              <h4>Estudiantes en {cursosDB[selectedCurso].nombre}</h4>
              <div className="card mb-4 p-3">
                <AgregarEstudianteForm
                  nuevoEstudiante={nuevoEstudiante}
                  setNuevoEstudiante={setNuevoEstudiante}
                  notas={notas}
                  setNotas={setNotas}
                  notasExtras={notasExtras}
                  handleNotaExtraChange={handleNotaExtraChange}
                  agregarNotaExtra={agregarNotaExtra}
                  agregarEstudiante={agregarEstudiante}
                  errorEstudiante={errorEstudiante}
                />
                <div className="mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar estudiante..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                  />
                </div>
                <EstudiantesTabla
                  estudiantes={estudiantesFiltrados}
                  notasExtras={notasExtras}
                  handleVerPerfilAlumno={handleVerPerfilAlumno}
                  guardarNotasEditadas={guardarNotasEditadas}
                  eliminarEstudiante={eliminarEstudiante}
                />
                {pendingChanges && (
                  <div className="d-flex justify-content-end mt-2">
                    <button className="btn btn-success" onClick={guardarCambios}>
                      Guardar cambios en la base de datos
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfesorPanel;
