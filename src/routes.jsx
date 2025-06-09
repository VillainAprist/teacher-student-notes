import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Perfil from './pages/Perfil';
import AlumnoPanel from './pages/AlumnoPanel';
import ProfesorPanel from './pages/ProfesorPanel';
import EditarPerfil from './pages/EditarPerfil';
import AdminPanel from './pages/AdminPanel';

export default function AppRoutes({ user, setUser, perfil, setPerfil, cursos, setCursos }) {
  if (!user) {
    return <Routes>
      <Route path="*" element={<Login onLogin={setUser} />} />
    </Routes>;
  }
  return (
    <Routes>
      <Route path="/" element={<Navigate to={user.role === 'profesor' ? '/profesor' : '/alumno'} />} />
      <Route path="/perfil/:id" element={<Perfil user={user} perfil={perfil} setPerfil={setPerfil} />} />
      <Route path="/editar-perfil" element={<EditarPerfil user={user} perfil={perfil} setPerfil={setPerfil} />} />
      <Route path="/alumno" element={<AlumnoPanel user={user} cursos={cursos} perfil={perfil} />} />
      <Route path="/profesor" element={<ProfesorPanel user={user} cursos={cursos} setCursos={setCursos} />} />
      <Route path="/admin-oculto-123" element={user.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />} />
      <Route path="*" element={<Navigate to={user.role === 'profesor' ? '/profesor' : '/alumno'} />} />
    </Routes>
  );
}
