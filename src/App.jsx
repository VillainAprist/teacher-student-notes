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

function App() {
  const { user, setUser, cursos, setCursos, perfil, setPerfil, darkMode, setDarkMode } = useAppContext();

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
            <div className="collapse navbar-collapse">
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                  <Link className="nav-link" style={{color:'#fff'}} to="/">Inicio</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" style={{color:'#fff'}} to={`/perfil/${user?.uid}`}>Perfil</Link>
                </li>
              </ul>
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
    </Router>
  )
}

export default App
