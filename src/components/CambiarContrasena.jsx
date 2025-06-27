import { useState } from 'react';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export default function CambiarContrasena({ requireOld = false }) {
  const [antigua, setAntigua] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleCambiar = async (e) => {
    e.preventDefault();
    setMensaje('');
    if (nueva.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (nueva !== confirmar) {
      setMensaje('Las contraseñas no coinciden.');
      return;
    }
    setCargando(true);
    try {
      const auth = getAuth();
      if (requireOld) {
        const user = auth.currentUser;
        const email = user.email;
        const credential = EmailAuthProvider.credential(email, antigua);
        await reauthenticateWithCredential(user, credential);
      }
      await updatePassword(auth.currentUser, nueva);
      setMensaje('Contraseña actualizada correctamente.');
      setAntigua('');
      setNueva('');
      setConfirmar('');
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setMensaje('La contraseña actual es incorrecta.');
      } else if (err.code === 'auth/requires-recent-login') {
        setMensaje('Debes volver a iniciar sesión para cambiar la contraseña.');
      } else {
        setMensaje('Error: ' + (err.message || 'No se pudo cambiar la contraseña.'));
      }
    }
    setCargando(false);
  };

  return (
    <form onSubmit={handleCambiar} className="mb-3 mt-4">
      <h5 className="mb-3">Cambiar contraseña</h5>
      {requireOld && (
        <div className="mb-2">
          <label className="form-label">Contraseña actual</label>
          <input type="password" className="form-control" value={antigua} onChange={e => setAntigua(e.target.value)} required minLength={6} />
        </div>
      )}
      <div className="mb-2">
        <label className="form-label">Nueva contraseña</label>
        <input type="password" className="form-control" value={nueva} onChange={e => setNueva(e.target.value)} required minLength={6} />
      </div>
      <div className="mb-2">
        <label className="form-label">Confirmar contraseña</label>
        <input type="password" className="form-control" value={confirmar} onChange={e => setConfirmar(e.target.value)} required minLength={6} />
      </div>
      <button className="btn btn-primary" type="submit" disabled={cargando}>{cargando ? 'Cambiando...' : 'Cambiar contraseña'}</button>
      {mensaje && <div className="mt-2 alert alert-info">{mensaje}</div>}
    </form>
  );
}
