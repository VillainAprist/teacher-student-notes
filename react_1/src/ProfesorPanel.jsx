import Papa from 'papaparse';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { db } from './firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
  const navigate = useNavigate();
  const fileInputRef = useRef();

  // Cargar cursos desde Firestore al iniciar
  useEffect(() => {
    const fetchCursos = async () => {
      let cursosCol;
      if (user?.email) {
        cursosCol = query(collection(db, 'cursos'), where('profesor', '==', user.email));
      } else {
        cursosCol = collection(db, 'cursos');
      }
      const cursosSnapshot = await getDocs(cursosCol);
      const cursosData = cursosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCursos(cursosData);
    };
    fetchCursos();
  }, [user]);

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
        const nuevosCursos = [...cursos];
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
      setCursos([...cursos, { ...nuevo, id: docRef.id }]);
      setNuevoCurso('');
      setNuevaSeccion('');
      setSelectedCurso(cursos.length);
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
  const agregarEstudiante = () => {
    if (nuevoEstudiante.trim() !== '' && notas.pc1 && notas.pc2 && notas.parcial && notas.final) {
      const nuevosCursos = [...cursos];
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
    }
  };

  const handleSelectCurso = (idx) => {
    setSelectedCurso(idx);
    setShowChartIdx(null);
  };

  const exportarExcel = () => {
    if (!cursos.length) return;
    const sheets = {};
    cursos.forEach((curso) => {
      const headers = ['Nombre', 'PC1', 'PC2', 'Parcial', 'Final', ...Object.values(curso.estudiantes[0]?.notas || {}).filter((_, i) => i >= 4 ? true : false).map((_, idx) => `Opc${idx+1}`), 'Nota Final'];
      const data = curso.estudiantes.map(est => {
        const pc1 = +est.notas.pc1 || 0;
        const pc2 = +est.notas.pc2 || 0;
        // Calcula promedio de extras
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
        return {
          Nombre: est.nombre,
          PC1: est.notas.pc1,
          PC2: est.notas.pc2,
          Parcial: est.notas.parcial,
          Final: est.notas.final,
          ...Object.fromEntries(Object.keys(est.notas).filter(k => k.startsWith('opc')).map(k => [k.toUpperCase(), est.notas[k]])),
          'Nota Final': notaFinal.toFixed(2)
        };
      });
      sheets[curso.nombre] = XLSX.utils.json_to_sheet(data);
    });
    const wb = XLSX.utils.book_new();
    Object.entries(sheets).forEach(([nombre, sheet]) => {
      XLSX.utils.book_append_sheet(wb, sheet, nombre.substring(0, 31));
    });
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'cursos_fiei.xlsx');
  };

  const exportarCSV = () => {
    if (!cursos.length) return;
    let csv = '';
    cursos.forEach((curso, idx) => {
      csv += `Curso: ${curso.nombre}\n`;
      const headers = ['Nombre', 'PC1', 'PC2', 'Parcial', 'Final', ...Object.keys(curso.estudiantes[0]?.notas||{}).filter(k=>k.startsWith('opc')).map(k=>k.toUpperCase()), 'Nota Final'];
      csv += headers.join(',') + '\n';
      curso.estudiantes.forEach(est => {
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
        const row = [
          est.nombre,
          est.notas.pc1,
          est.notas.pc2,
          est.notas.parcial,
          est.notas.final,
          ...Object.keys(est.notas).filter(k=>k.startsWith('opc')).map(k=>est.notas[k]),
          notaFinal.toFixed(2)
        ];
        csv += row.join(',') + '\n';
      });
      if (idx < cursos.length-1) csv += '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'cursos_fiei.csv');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const guardarNotasEditadas = async (i) => {
    const nuevosCursos = [...cursos];
    nuevosCursos[selectedCurso].estudiantes[i].notas = { ...editNotas };
    setCursos(nuevosCursos);
    setPendingChanges(true);
    setEditAlumnoIdx(null);
  };

  const eliminarEstudiante = async (i) => {
    const nuevosCursos = [...cursos];
    nuevosCursos[selectedCurso].estudiantes.splice(i, 1);
    setCursos(nuevosCursos);
    setPendingChanges(true);
  };

  const guardarCambios = async () => {
    if (selectedCurso === null || !cursos[selectedCurso].id) return;
    await updateDoc(doc(db, 'cursos', cursos[selectedCurso].id), { estudiantes: cursos[selectedCurso].estudiantes });
    setPendingChanges(false);
  };

  const eliminarCurso = async (idx) => {
    const curso = cursos[idx];
    if (!curso.id) return;
    if (window.confirm('¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.')) {
      await deleteDoc(doc(db, 'cursos', curso.id));
      const nuevosCursos = cursos.filter((_, i) => i !== idx);
      setCursos(nuevosCursos);
      // Si el curso eliminado era el seleccionado, deselecciona
      if (selectedCurso === idx) setSelectedCurso(null);
    }
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
                  <button className="btn btn-secondary" type="button" onClick={agregarNotaExtra}>+ Nota</button>
                  <button className="btn btn-primary" type="button" onClick={agregarEstudiante}>Agregar Estudiante</button>
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
                    const pc1 = +est.notas.pc1 || 0;
                    const pc2 = +est.notas.pc2 || 0;
                    const extrasKeys = notasExtras.map(n => n.nombre).filter(k => est.notas[k] !== '' && !isNaN(est.notas[k]));
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
