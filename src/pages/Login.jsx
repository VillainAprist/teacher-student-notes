import { useState } from 'react';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
      // Obtener datos desde Firestore
      const userDoc = await getDoc(doc(db, 'usuarios', userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Ahora pasamos el uid, email, rol, nombre y codigo
        onLogin({
          username: userData.nombre || username,
          email: userCredential.user.email,
          uid: userCredential.user.uid,
          role: userData.rol,
          codigo: userData.codigo || '',
          nombre: userData.nombre || '',
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

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center vh-100" style={{ padding: 0, margin: 0 }}>
      <div className="card p-4 shadow w-100" style={{ minWidth: 350, maxWidth: 500, margin: 0 }}>
        <h2 className="mb-4 text-center">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
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
          {error && <div className="alert alert-danger">{error}</div>}
          <button className="btn btn-primary w-100" type="submit">Iniciar Sesión</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
