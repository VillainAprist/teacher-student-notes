import { useState } from 'react';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const ESCUELAS = [
  'Informática',
  'Mecatrónica',
  'Electrónica',
  'Telecomunicaciones'
];

function EditarPerfil({ perfil, user, setPerfil, onGuardado }) {
  const [form, setForm] = useState({ ...perfil });
  const [nuevaImagen, setNuevaImagen] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNuevaImagen(file);
      const reader = new FileReader();
      reader.onload = (ev) => setForm(f => ({ ...f, imagen: ev.target.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await updateDoc(doc(db, 'usuarios', user.uid || user.username), {
        ...form
      });
      setPerfil(p => ({ ...p, ...form }));
      if (onGuardado) onGuardado();
    } catch (e) {
      alert('Error al guardar los cambios');
    }
    setGuardando(false);
  };

  return (
    <div className="container mt-4">
      <h2>Editar Perfil</h2>
      <div className="card p-4 mb-3">
        <div className="mb-3">
          <label className="form-label">Teléfono</label>
          <input className="form-control" name="telefono" value={form.telefono} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label">Escuela</label>
          <select className="form-select" name="escuela" value={form.escuela} onChange={handleChange}>
            {ESCUELAS.map(esc => <option key={esc} value={esc}>{esc}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Sección</label>
          <input className="form-control" name="seccion" value={form.seccion} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label">Descripción</label>
          <textarea className="form-control" name="masInfo" rows={3} value={form.masInfo || ''} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label">Foto de perfil</label>
          <input type="file" accept="image/*" className="form-control" onChange={handleImagenChange} />
          {form.imagen && <img src={form.imagen} alt="avatar" style={{width:80, height:80, borderRadius:'50%', objectFit:'cover', border:'2px solid #A05252', marginTop:8}} />}
        </div>
        <div className="alert alert-info">
          Solo puedes editar tu teléfono, escuela, sección y descripción. El resto de los datos son gestionados por el sistema.
        </div>
        <div className="mt-3">
          <button className="btn btn-success me-2" onClick={handleGuardar} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
          {onGuardado && <button className="btn btn-secondary" onClick={onGuardado}>Cancelar</button>}
        </div>
      </div>
    </div>
  );
}

export default EditarPerfil;
