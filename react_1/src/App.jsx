import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Login from './Login'
import ProfesorPanel from './ProfesorPanel'
import AlumnoPanel from './AlumnoPanel'

function App() {
  const [user, setUser] = useState(null)
  const [cursos, setCursos] = useState([])

  const handleLogout = () => setUser(null)

  if (!user) {
    return <Login onLogin={(username, password, role) => setUser({ username, role })} />
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg" style={{background: 'linear-gradient(90deg, #A05252 60%, #5C2B2B 100%)', color: '#fff', position: 'fixed', top: 0, left: 0, width: '100vw', zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
        <div className="container-fluid px-4">
          <a className="navbar-brand fw-bold" href="#" style={{color: '#fff', letterSpacing: 1}}>
            UNFV - FIEI | Gestor de Notas
          </a>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {user.role === 'profesor' && (
                <>
                  <li className="nav-item">
                    <a className="nav-link active" aria-current="page" href="#" style={{color: '#fff'}}>Cursos</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#csv" style={{color: '#fff'}}>Cargar CSV</a>
                  </li>
                </>
              )}
            </ul>
            <span className="navbar-text me-3" style={{color: '#fff'}}>{user.username} ({user.role})</span>
            <button className="btn btn-outline-light" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>
      <div style={{height: 70}}></div>
      {user.role === 'profesor' ? (
        <ProfesorPanel cursos={cursos} setCursos={setCursos} />
      ) : (
        <AlumnoPanel cursos={cursos} alumno={user.username} />
      )}
    </>
  )
}

export default App
