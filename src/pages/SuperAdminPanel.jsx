import React, { useEffect, useState, useContext } from 'react';
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../services/firebase';
import { AppContext } from '../context/AppContext';

const ROLES = ['estudiante', 'profesor'];

function AdminPanel() {
  const { user } = useContext(AppContext);
  const [usuarios, setUsuarios] = useState([]);
  const [filtroRol, setFiltroRol] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', codigo: '', rol: 'estudiante' });
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ estudiante: 0, profesor: 0 });

  // Cargar usuarios
  useEffect(() => {
    const fetchUsuarios = async () => {
      setLoading(true);
      const usuariosSnap = await getDocs(collection(db, 'usuarios'));
      const lista = usuariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuarios(lista);
      // Estadísticas
      const statsObj = { estudiante: 0, profesor: 0 };
      lista.forEach(u => { if (u.rol && statsObj[u.rol] !== undefined) statsObj[u.rol]++; });
      setStats(statsObj);
      setLoading(false);
    };
    fetchUsuarios();
  }, []);

  // Filtros y búsqueda
  const usuariosFiltrados = usuarios.filter(u =>
    (!filtroRol || u.rol === filtroRol) &&
    (u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || u.codigo?.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // Cambiar rol
  const handleRolChange = async (id, nuevoRol) => {
    await updateDoc(doc(db, 'usuarios', id), { rol: nuevoRol });
    setUsuarios(usuarios => usuarios.map(u => u.id === id ? { ...u, rol: nuevoRol } : u));
    setStats(s => ({ ...s, [nuevoRol]: s[nuevoRol] + 1, [usuarios.find(u => u.id === id).rol]: s[usuarios.find(u => u.id === id).rol] - 1 }));
  };

  // Crear usuario manualmente (solo nombre, código, rol)
  const handleCrearUsuario = async e => {
    e.preventDefault();
    setError('');
    const { nombre, codigo, rol } = nuevoUsuario;
    if (!nombre || !codigo || !rol) {
      setError('Nombre, código y rol requeridos');
      return;
    }
    const email = `${codigo}@unfv.edu.pe`;
    const password = codigo;
    // Verifica si ya existe
    if (usuarios.some(u => u.codigo === codigo || u.email === email)) {
      setError('Ya existe un usuario con ese código o email');
      return;
    }
    try {
      // Crea en Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Crea en Firestore
      await addDoc(collection(db, 'usuarios'), {
        nombre,
        codigo,
        email,
        rol,
        createdAt: new Date().toISOString()
      });
      setUsuarios([...usuarios, { nombre, codigo, email, rol, id: Math.random().toString(36) }]);
      setStats(s => ({ ...s, [rol]: s[rol] + 1 }));
      setNuevoUsuario({ nombre: '', codigo: '', rol: 'estudiante' });
    } catch (err) {
      setError('Error al crear usuario: ' + (err.message || err.code));
    }
  };

  // Eliminar usuario
  const handleEliminarUsuario = async id => {
    if (!window.confirm('¿Eliminar usuario?')) return;
    await deleteDoc(doc(db, 'usuarios', id));
    const eliminado = usuarios.find(u => u.id === id);
    setUsuarios(usuarios.filter(u => u.id !== id));
    setStats(s => ({ ...s, [eliminado.rol]: s[eliminado.rol] - 1 }));
  };

  return (
    <div className="container mt-4">
      <h2>Panel de Administración</h2>
      <div className="mb-3 d-flex gap-4 flex-wrap align-items-center">
        <div>
          <strong>Usuarios:</strong> {usuarios.length}
        </div>
        <div>
          <span className="badge bg-primary me-2">Estudiantes: {stats.estudiante}</span>
          <span className="badge bg-success me-2">Profesores: {stats.profesor}</span>
        </div>
        <div>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre o código"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ minWidth: 220 }}
          />
        </div>
        <div>
          <select className="form-select" value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
            <option value="">Todos los roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="card p-3 mb-4">
        <h5>Crear usuario manualmente</h5>
        <form className="row g-2 align-items-end" onSubmit={handleCrearUsuario}>
          <div className="col-md-4">
            <input type="text" className="form-control" placeholder="Nombre" value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })} />
          </div>
          <div className="col-md-4">
            <input type="text" className="form-control" placeholder="Código" value={nuevoUsuario.codigo} onChange={e => setNuevoUsuario({ ...nuevoUsuario, codigo: e.target.value })} />
          </div>
          <div className="col-md-3">
            <select className="form-select" value={nuevoUsuario.rol} onChange={e => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}>
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div className="col-md-1">
            <button type="submit" className="btn btn-primary">Crear</button>
          </div>
          {error && <div className="col-12 text-danger small">{error}</div>}
        </form>
      </div>
      <div className="table-responsive">
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4}>Cargando...</td></tr>
            ) : usuariosFiltrados.length === 0 ? (
              <tr><td colSpan={4}>No hay usuarios.</td></tr>
            ) : usuariosFiltrados.map(u => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>
                  <select className="form-select form-select-sm" value={u.rol} onChange={e => handleRolChange(u.id, e.target.value)}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleEliminarUsuario(u.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPanel;
