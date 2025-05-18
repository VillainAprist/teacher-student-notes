import { useState } from 'react';
import { auth, db } from './firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('alumno');
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    setError('');
    try {
      // Login real con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      // Obtener el rol desde Firestore
      const userDoc = await getDoc(doc(db, 'usuarios', userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Ahora pasamos el uid, email y rol
        onLogin({
          username: username,
          email: userCredential.user.email,
          uid: userCredential.user.uid,
          role: userData.rol
        });
      } else {
        setError('No se encontró información de usuario.');
      }
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El correo no es válido.');
      } else {
        setError('Error al iniciar sesión: ' + (err.message || ''));
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setRegisterError('Por favor, completa todos los campos.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, username, password);
      // Guarda el rol en Firestore
      await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
        email: username,
        rol: role,
        createdAt: new Date()
      });
      setShowRegister(false);
      setRegisterError('');
      setError('Cuenta creada correctamente. Ahora puedes iniciar sesión.');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setRegisterError('El correo ya está registrado.');
      } else if (err.code === 'auth/invalid-email') {
        setRegisterError('El correo no es válido.');
      } else if (err.code === 'auth/weak-password') {
        setRegisterError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setRegisterError('Error al crear la cuenta: ' + (err.message || ''));
      }
    }
  };

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center vh-100" style={{ padding: 0, margin: 0 }}>
      <div className="card p-4 shadow w-100" style={{ minWidth: 350, maxWidth: 500, margin: 0 }}>
        <h2 className="mb-4 text-center">{showRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
        <form onSubmit={showRegister ? handleRegister : handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Correo:</label>
            <input
              type="email"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Contraseña:</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Rol:</label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="alumno">Alumno</option>
              <option value="profesor">Profesor</option>
            </select>
          </div>
          {showRegister && registerError && <p className="text-danger">{registerError}</p>}
          {!showRegister && error && <p className="text-danger">{error}</p>}
          <button type="submit" className="btn btn-primary w-100 py-2">{showRegister ? 'Crear Cuenta' : 'Entrar'}</button>
        </form>
        <div className="text-center mt-3">
          {showRegister ? (
            <button className="btn btn-link" onClick={() => { setShowRegister(false); setRegisterError(''); }}>¿Ya tienes cuenta? Inicia sesión</button>
          ) : (
            <button className="btn btn-link" onClick={() => { setShowRegister(true); setError(''); }}>¿No tienes cuenta? Crear cuenta</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
