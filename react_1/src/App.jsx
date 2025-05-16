import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Login from './Login'
import ProfesorPanel from './ProfesorPanel'
import AlumnoPanel from './AlumnoPanel'
import Perfil from './Perfil'

function App() {
  const [user, setUser] = useState(null)
  const [cursos, setCursos] = useState([])
  const [perfil, setPerfil] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    escuela: '',
    seccion: '',
    imagen: '', // Added to store profile image
  })

  const handleLogout = () => setUser(null)

  if (!user) {
    return <Login onLogin={(username, password, role) => {
      setUser({ username, role })
      setPerfil(p => ({ ...p, nombre: username }))
    }} />
  }

  return (
    <Router>
      <nav className="navbar navbar-expand-lg" style={{background: 'linear-gradient(90deg, #A05252 60%, #5C2B2B 100%)', color: '#fff', position: 'fixed', top: 0, left: 0, width: '100vw', zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
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
                <Link className="nav-link" style={{color:'#fff'}} to="/perfil">Perfil</Link>
              </li>
            </ul>
            <span className="navbar-text me-3 d-flex align-items-center" style={{color: '#fff'}}>
              {perfil?.imagen && (
                <img src={perfil.imagen} alt="avatar" style={{width:32, height:32, borderRadius:'50%', objectFit:'cover', border:'1.5px solid #fff', marginRight:8}} />
              )}
              {user.username} ({user.role})
            </span>
            <button className="btn btn-outline-light" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>
      <div style={{height: 70}}></div>
      <div className="container-fluid mb-4 px-4">
        <Routes>
          <Route path="/perfil" element={<Perfil perfil={perfil} user={user} editable setPerfil={setPerfil} />} />
          <Route path="/" element={user.role === 'profesor' ? (
            <ProfesorPanel cursos={cursos} setCursos={setCursos} />
          ) : (
            <AlumnoPanel cursos={cursos} alumno={user.username} />
          )} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
