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
import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { useCursos } from '../hooks/useCursos';

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
  const [editAlumnoIdx, setEditAlumnoIdx] = useState(null);
  const [editNotas, setEditNotas] = useState({ pc1: '', pc2: '', parcial: '', final: '', extras: '' });
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
      const nuevo = {
        nombre: nuevoCurso,
        escuela: nuevaEscuela,
        seccion: nuevaSeccion,
        estudiantes: [],
        profesor: user.email, // Email del profesor autenticado
        profesorUid: user.uid // UID del profesor autenticado
      };
      const docRef = await addDoc(collection(db, 'cursos'), nuevo);
      // No actualices setCursos aquí, espera a que el hook useCursos se actualice automáticamente
      setNuevoCurso('');
      setNuevaSeccion('');
      setSelectedCurso(null); // Deselecciona para evitar errores de índice
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
      let usuarioSnap = await getDocs(query(collection(db, 'usuarios'), where('nombre', '==', nuevoEstudiante)));
      if (usuarioSnap.empty) {
        usuarioSnap = await getDocs(query(collection(db, 'usuarios'), where('email', '==', nuevoEstudiante)));
      }
      if (usuarioSnap.empty) {
        usuarioSnap = await getDocs(query(collection(db, 'usuarios'), where('codigo', '==', nuevoEstudiante)));
      }
      let uid = '';
      let email = '';
      let codigo = '';
      if (!usuarioSnap.empty) {
        const userDoc = usuarioSnap.docs[0];
        uid = userDoc.id;
        email = userDoc.data().email || '';
        codigo = userDoc.data().codigo || '';
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
          await addDoc(collection(db, 'inscripciones'), {
            cursoId: cursosDB[selectedCurso].id,
            alumnoUid: uid,
            alumnoEmail: email,
            alumnoCodigo: codigo,
            fecha: new Date()
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
    setEditAlumnoIdx(null);
  };

  const eliminarEstudiante = async (i) => {
    const nuevosCursos = [...cursosDB];
    nuevosCursos[selectedCurso].estudiantes.splice(i, 1);
    setCursos(nuevosCursos);
    setPendingChanges(true);
  };

  const guardarCambios = async () => {
    if (selectedCurso === null || !cursosDB[selectedCurso].id) return;
    await updateDoc(doc(db, 'cursos', cursosDB[selectedCurso].id), { estudiantes: cursosDB[selectedCurso].estudiantes });
    setPendingChanges(false);
  };

  const eliminarCurso = async (idx) => {
    const curso = cursosDB[idx];
    if (!curso.id) return;
    if (window.confirm('¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.')) {
      await deleteDoc(doc(db, 'cursos', curso.id));
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
                  <button className="btn btn-secondary" type="button" onClick={agregarNotaExtra}>+ Nota</button>
                  <button className="btn btn-primary" type="button" onClick={agregarEstudiante}>Agregar Estudiante</button>
                </div>
                {errorEstudiante && (
                  <div className="alert alert-danger my-2">{errorEstudiante}</div>
                )}
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
                    // Asegurarse de que las notas extras estén alineadas correctamente
                    const pc1 = est.notas?.pc1 ?? '';
                    const pc2 = est.notas?.pc2 ?? '';
                    const parcial = est.notas?.parcial ?? '';
                    const final = est.notas?.final ?? '';
                    // Mostrar extras en el mismo orden que notasExtras
                    const extrasValues = notasExtras.map(n => est.notas?.[n.nombre] ?? '');
                    // Calcular promedio correctamente
                    const extrasKeys = notasExtras.map(n => n.nombre).filter(k => est.notas[k] !== '' && !isNaN(est.notas[k]));
                    let promedioExtras = 0;
                    if (extrasKeys.length > 0) {
                      promedioExtras = extrasKeys.reduce((acc, k) => acc + (+est.notas[k] || 0), 0) / extrasKeys.length;
                    }
                    let promedioPC = 0;
                    if (extrasKeys.length > 0) {
                      promedioPC = ((+pc1 + +pc2) / 2) * 0.5 + promedioExtras * 0.5;
                    } else {
                      promedioPC = (+pc1 + +pc2) / 2;
                    }
                    let notaFinal = (promedioPC * 0.4) + ((+parcial || 0) * 0.3) + ((+final || 0) * 0.3);
                    if (notaFinal > 20) notaFinal = 20;
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
                          <button className="btn btn-success btn-sm me-1" onClick={() => guardarNotasEditadas(i)}>Guardar</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditAlumnoIdx(null)}>Cancelar</button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={i}>
                        <td>
                          <span
                            style={{ color: '#A05252', cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => handleVerPerfilAlumno(est.nombre, est.codigo, est.uid)}
                          >
                            {est.nombre}
                          </span>
                        </td>
                        <td>{pc1}</td>
                        <td>{pc2}</td>
                        <td>{parcial}</td>
                        <td>{final}</td>
                        {extrasValues.map((val, idx) => (
                          <td key={idx}>{val}</td>
                        ))}
                        <td>{notaFinal.toFixed(2)}</td>
                        <td>
                          <button className="btn btn-warning btn-sm" onClick={() => {
                            setEditAlumnoIdx(i);
                            setEditNotas({ ...est.notas });
                          }}>Editar</button>
                          <button className="btn btn-danger btn-sm ms-1" onClick={() => eliminarEstudiante(i)}>Eliminar</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {pendingChanges && (
                <div className="d-flex justify-content-end mt-2">
                  <button className="btn btn-success" onClick={guardarCambios}>
                    Guardar cambios en la base de datos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfesorPanel;
