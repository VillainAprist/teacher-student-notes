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
import { db } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useCursos } from '../hooks/useCursos';
import { useCursosAlumno } from '../hooks/useCursosAlumno';
import { useAlumnosPorCurso } from '../hooks/useAlumnosPorCurso';
import { calcularNotaFinal } from '../utils/calculoNotas';
import { cursosService } from '../services/cursosService';
import { notificacionesService } from '../services/notificacionesService';

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
  const [mensajeExito, setMensajeExito] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef();

  // Hook para cursos según rol
  let cursosDB = [];
  let alumnosInscritos = [];
  let useAlumnosPorCursoResult = { alumnos: [] };
  if (user?.role === 'alumno') {
    // Si el usuario es alumno, usar useCursosAlumno
    const { cursos: cursosAlumno = [] } = useCursosAlumno(user.uid) || {};
    cursosDB = cursosAlumno;
  } else if (user?.role === 'profesor') {
    // Si el usuario es profesor, usar useCursos filtrando por profesorUid
    cursosDB = useCursos({ profesorUid: user.uid }) || [];
    // Hook de alumnos por curso SIEMPRE se llama, pero pasa null si no hay curso seleccionado
    const cursoId = (selectedCurso !== null && cursosDB[selectedCurso]) ? cursosDB[selectedCurso].id : null;
    useAlumnosPorCursoResult = useAlumnosPorCurso(cursoId);
    alumnosInscritos = useAlumnosPorCursoResult.alumnos || [];
  } else {
    cursosDB = [];
  }
  cursosDB = cursosDB.map(curso => ({ ...curso, estudiantes: Array.isArray(curso.estudiantes) ? curso.estudiantes : [] }));

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

  const quitarNotaExtra = () => {
    if (notasExtras.length > 0) {
      setNotasExtras(notasExtras.slice(0, -1));
    }
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
            alumnoCodigo: codigo,
            notas: notasNumericas // Ahora se guarda el campo notas
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

  // Estado local para notas editadas pendientes
  const [notasPendientes, setNotasPendientes] = useState({});

  // Estado para edición masiva
  const [edicionMasiva, setEdicionMasiva] = useState(false);

  // Guardar notas editadas localmente (solo en el estado, no en Firestore)
  const guardarNotasEditadas = (i, notasEditadas) => {
    if (selectedCurso === null || !cursosDB[selectedCurso]) return;
    const alumno = estudiantesFiltrados[i];
    // Usa alumno.alumnoUid si existe, si no uid
    const alumnoUid = alumno.alumnoUid || alumno.uid;
    if (!alumno || !alumnoUid) return;
    setNotasPendientes(prev => ({
      ...prev,
      [alumnoUid]: notasEditadas
    }));
    setMensajeExito('Notas editadas localmente. Recuerda guardar globalmente.');
    setTimeout(() => setMensajeExito(''), 2000);
  };

  // Guardar todas las notas pendientes en Firestore con confirmación
  const guardarNotasGlobal = async () => {
    if (selectedCurso === null || !cursosDB[selectedCurso]) return;
    if (!window.confirm('¿Quieres guardar todas las notas en la base de datos?')) return;
    const cursoId = cursosDB[selectedCurso].id;
    const cursoNombre = cursosDB[selectedCurso].nombre;
    for (const alumno of estudiantesFiltrados) {
      const alumnoUid = alumno.alumnoUid || alumno.uid;
      if (notasPendientes[alumnoUid]) {
        await cursosService.actualizarNotasInscripcion({
          cursoId,
          alumnoUid,
          notas: notasPendientes[alumnoUid]
        });
        // Crear notificación para el alumno
        await notificacionesService.crearNotificacion({
          usuarioUid: alumnoUid,
          titulo: 'Notas actualizadas',
          mensaje: `Tus notas han sido actualizadas en el curso ${cursoNombre}.`,
          tipo: 'notas_actualizadas',
          extra: { cursoId, cursoNombre }
        });
      }
    }
    setNotasPendientes({});
    setMensajeExito('¡Notas guardadas globalmente con éxito!');
    setTimeout(() => setMensajeExito(''), 2000);
    window.location.reload();
  };

  // Guardar todas las notas editadas en modo masivo
  const guardarNotasMasivo = () => {
    // Llama a guardarNotasGlobal (ya implementado)
    guardarNotasGlobal();
    setEdicionMasiva(false);
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

  // En vez de usar cursosDB[selectedCurso].estudiantes, usar alumnosInscritos para mostrar la tabla
  const estudiantesFiltrados = selectedCurso !== null
    ? alumnosInscritos.filter(est =>
        (est.alumnoEmail || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (est.alumnoCodigo || '').toLowerCase().includes(busqueda.toLowerCase())
      )
    : [];

  // Función para buscar y navegar al perfil del estudiante
  const handleVerPerfilAlumno = async (nombre, codigo, uid) => {
    if (uid) {
      navigate(`/perfil/${uid}`);
      return;
    }
    // Si no hay UID, intenta buscar por código o nombre
    let usuarioSnap = null;
    if (codigo) usuarioSnap = await cursosService.buscarUsuarioPorCampo('codigo', codigo);
    if (!usuarioSnap && nombre) usuarioSnap = await cursosService.buscarUsuarioPorCampo('nombre', nombre);
    if (usuarioSnap && usuarioSnap.id) {
      navigate(`/perfil/${usuarioSnap.id}`);
    } else {
      alert('No se encontró el perfil del alumno.');
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
      {mensajeExito && (
        <div className="alert alert-success" role="alert">
          {mensajeExito}
        </div>
      )}
      <h2>Gestión de Cursos Universitarios</h2>
      <div className="row" style={{ marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0 }}>
        <div className="col-md-3" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <ul className="list-group">
            {cursosDB.map((curso, idx) => (
              <li
                key={idx}
                className={`list-group-item d-flex align-items-center ${selectedCurso === idx ? 'active' : ''}`}
                onClick={() => handleSelectCurso(idx)}
                style={{
                  cursor: 'pointer',
                  marginBottom: 12,
                  padding: '18px 18px',
                  borderRadius: 12,
                  boxShadow: selectedCurso === idx ? '0 2px 12px rgba(160,82,82,0.08)' : '0 1px 4px rgba(160,82,82,0.04)',
                  border: selectedCurso === idx ? '2px solid #A05252' : '1.5px solid #eee',
                  transition: 'box-shadow 0.2s, border 0.2s',
                  minWidth: 0,
                  background: selectedCurso === idx ? '#A05252' : '#fff', // Fondo más oscuro al seleccionar
                  color: selectedCurso === idx ? '#fff' : '#5C2B2B' // Letras blancas si está seleccionado
                }}
              >
                <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    {/* Avatar eliminado */}
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontSize: 18, color: selectedCurso === idx ? '#fff' : '#5C2B2B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{curso.nombre}</strong>
                      <div style={{ fontSize: '0.95em', color: selectedCurso === idx ? '#f5dada' : '#A05252', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {curso.escuela} - Sección {curso.seccion}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Eliminar botones de importar CSV, ver gráfica y eliminar curso */}
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-9" style={{ paddingLeft: 0, paddingRight: 0 }}>
          {selectedCurso !== null && (
            <div>
              <h4>Estudiantes en {cursosDB[selectedCurso].nombre}</h4>
              <div className="card mb-4 p-3">
                <div className="mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar estudiante..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                  />
                </div>
                {/* Botón para ver gráfica */}
                <div className="mb-3 text-end">
                  <button className="btn btn-outline-success" onClick={() => setShowChartIdx(selectedCurso)}>
                    Ver Gráfica
                  </button>
                </div>
                <div className="mb-2 text-end">
                  {!edicionMasiva ? (
                    <button className="btn btn-warning" onClick={() => setEdicionMasiva(true)}>
                      Editar todas las notas
                    </button>
                  ) : (
                    <button className="btn btn-success" onClick={guardarNotasGlobal}>
                      Guardar todas las notas
                    </button>
                  )}
                </div>
                <EstudiantesTabla
                  estudiantes={estudiantesFiltrados}
                  notasExtras={notasExtras}
                  handleVerPerfilAlumno={handleVerPerfilAlumno}
                  guardarNotasEditadas={guardarNotasEditadas}
                  eliminarEstudiante={eliminarEstudiante}
                  edicionMasiva={edicionMasiva}
                  setNotasPendientes={setNotasPendientes}
                  notasPendientes={notasPendientes}
                  setEditAlumnoIdx={() => {}}
                />
                {/* Botón de guardado global */}
                {Object.keys(notasPendientes).length > 0 && (
                  <div className="d-flex justify-content-end mt-2">
                    <button className="btn btn-success" onClick={guardarNotasGlobal}>
                      Guardar todas las notas en la base de datos
                    </button>
                  </div>
                )}
                {/* Mostrar gráfica si corresponde */}
                {showChartIdx === selectedCurso && (
                  <div className="mb-4 mt-4">
                    <h5 className="mb-3">Desempeño de estudiantes en {cursosDB[selectedCurso].nombre}</h5>
                    <Bar
                      data={{
                        labels: estudiantesFiltrados.map(e => e.nombre),
                        datasets: [
                          {
                            label: 'Nota Final',
                            backgroundColor: '#A05252',
                            data: estudiantesFiltrados.map(est => {
                              // Calcular nota final usando la misma lógica que la tabla
                              const notas = est.notas || {};
                              const susti = notas.susti ?? notas.sustitutorio ?? '';
                              const aplaz = notas.aplaz ?? notas.aplazado ?? '';
                              return calcularNotaFinal({ ...notas, susti, aplaz }, notasExtras);
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfesorPanel;
