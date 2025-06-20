// React & Hooks
import { useEffect } from 'react';

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

// Componentes
import ThemeSwitcher from './components/ThemeSwitcher';

// Contexto
import { useAppContext } from './context/AppContext';

// Fuentes
import "@fontsource/inter";
import { FaBell } from 'react-icons/fa';
import { useUnreadNotificaciones } from './hooks/useUnreadNotificaciones';

function App() {
  const { user, setUser, cursos, setCursos, perfil, setPerfil, darkMode, setDarkMode } = useAppContext();
  const [unreadNotificaciones, notiError] = useUnreadNotificaciones(user);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

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
            <div className="collapse navbar-collapse d-flex justify-content-between align-items-center">
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                  <Link className="nav-link" style={{color:'#fff'}} to="/">Inicio</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" style={{color:'#fff'}} to={`/perfil/${user?.uid}`}>Perfil</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" style={{color:'#fff'}} to="/mensajes">Mensajes</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" style={{color:'#fff'}} to="/noticias">Noticias</Link>
                </li>
                {user?.role === 'admin' && (
                  <li className="nav-item">
                    <Link className="nav-link" style={{color:'#fff'}} to="/admin">Panel Admin</Link>
                  </li>
                )}
              </ul>
              {/* Notificaciones a la derecha para todos menos admin */}
              {(user?.role === 'profesor' || user?.role === 'alumno') && (
                <div className="d-flex align-items-center me-3">
                  <Link className="nav-link position-relative" style={{color:'#fff', fontSize:22, marginRight:16}} to="/notificaciones">
                    <FaBell />
                    {unreadNotificaciones > 0 && (
                      <span style={{position:'absolute', top:0, right:0, background:'#dc3545', color:'#fff', borderRadius:'50%', fontSize:12, minWidth:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', fontWeight:700, zIndex:2}}>
                        {unreadNotificaciones}
                      </span>
                    )}
                  </Link>
                </div>
              )}
              <span className="navbar-text me-3 d-flex align-items-center" style={{color: '#fff'}}>
                {perfil?.imagen && (
                  <img src={perfil.imagen} alt="avatar" style={{width:32, height:32, borderRadius:'50%', objectFit:'cover', border:'1.5px solid #fff', marginRight:8}} />
                )}
                {user?.nombre || user?.username} ({user?.role})
              </span>
              <ThemeSwitcher darkMode={darkMode} setDarkMode={setDarkMode} />
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
      {notiError && (
        <div className="alert alert-warning mt-2" style={{maxWidth:400, margin:'0 auto'}}>
          {notiError} <br />
          Si ves este mensaje, haz clic en el enlace de la consola para crear el índice en Firestore.
        </div>
      )}
    </Router>
  )
}

export default App
