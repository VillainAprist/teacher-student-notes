// React & Hooks
import { useState, useEffect } from 'react';

// React Router
import { BrowserRouter as Router, Link } from 'react-router-dom';

// Assets
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';

// Estilos globales
import './styles/App.css';

// Servicios
import { db } from './services/firebase.js';

// Rutas centralizadas
import AppRoutes from './routes';

function App() {
  const [user, setUserState] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [cursos, setCursos] = useState([]);
  const [perfil, setPerfil] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    escuela: '',
    seccion: '',
    imagen: '',
    codigo: ''
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const setUser = (u) => {
    setUserState(u);
    if (u) {
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      localStorage.removeItem('user');
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    if (!user) {
      setPerfil({ nombre: '', correo: '', telefono: '', escuela: '', seccion: '', imagen: '', codigo: '' });
      return;
    }
    const fetchPerfil = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid || user.username));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPerfil({
            nombre: data.nombre || user.nombre || user.username,
            correo: data.email || user.email || '',
            telefono: data.telefono || '',
            escuela: data.escuela || '',
            seccion: data.seccion || '',
            imagen: data.imagen || '',
            codigo: data.codigo || user.codigo || ''
          });
        } else {
          setPerfil({ nombre: user.nombre || user.username, correo: user.email || '', telefono: '', escuela: '', seccion: '', imagen: '', codigo: user.codigo || '' });
        }
      } catch {
        setPerfil({ nombre: user.nombre || user.username, correo: user.email || '', telefono: '', escuela: '', seccion: '', imagen: '', codigo: user.codigo || '' });
      }
    };
    fetchPerfil();
  }, [user]);

  useEffect(() => {
    const fetchCursos = async () => {
      if (!user) return;
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      let cursosCol;
      if (user.role === 'profesor') {
        cursosCol = query(collection(db, 'cursos'), where('profesor', '==', user.username));
      } else if (user.role === 'alumno') {
        cursosCol = collection(db, 'cursos');
      }
      const cursosSnapshot = await getDocs(cursosCol);
      let cursosData = cursosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (user.role === 'alumno') {
        cursosData = cursosData.filter(curso =>
          Array.isArray(curso.estudiantes) &&
          curso.estudiantes.some(e => e.nombre === user.username || e.email === user.username)
        );
      }
      setCursos(cursosData);
    };
    fetchCursos();
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    setCursos([]);
    setPerfil({ nombre: '', correo: '', telefono: '', escuela: '', seccion: '', imagen: '', codigo: '' });
    window.location.href = '/'; // Forzar recarga para limpiar el estado de la app
  };

  return (
    <Router>
      {user && (
        <nav className="navbar navbar-expand-lg" style={{background: darkMode ? 'linear-gradient(90deg, #222 60%, #444 100%)' : 'linear-gradient(90deg, #A05252 60%, #5C2B2B 100%)', color: '#fff', position: 'fixed', top: 0, left: 0, width: '100vw', zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
          <div className="container-fluid px-4">
            <a className="navbar-brand fw-bold" href="#" style={{color: '#fff', letterSpacing: 1}}>
              UNFV - FIEI | Gestor de Notas
            </a>
            <div className="collapse navbar-collapse">
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                  <Link className="nav-link" style={{color:'#fff'}} to="/">Inicio</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" style={{color:'#fff'}} to={`/perfil/${encodeURIComponent(user?.nombre || user?.username)}`}>Perfil</Link>
                </li>
              </ul>
              <span className="navbar-text me-3 d-flex align-items-center" style={{color: '#fff'}}>
                {perfil?.imagen && (
                  <img src={perfil.imagen} alt="avatar" style={{width:32, height:32, borderRadius:'50%', objectFit:'cover', border:'1.5px solid #fff', marginRight:8}} />
                )}
                {user?.nombre || user?.username} ({user?.role})
              </span>
              <button className="btn btn-outline-light me-2" onClick={() => setDarkMode(dm => !dm)}>
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button className="btn btn-outline-light" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </nav>
      )}
      {user && <div style={{height: 70}}></div>}
      <div className="container-fluid mb-4 px-4">
        <AppRoutes
          user={user}
          setUser={setUser}
          perfil={perfil}
          setPerfil={setPerfil}
          cursos={cursos}
          setCursos={setCursos}
        />
      </div>
    </Router>
  )
}

export default App
