import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function Perfil({ perfil, user, editable, setPerfil, showEditButton }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(perfil);
  const [showMore, setShowMore] = useState(false);

  const params = useParams();
  const navigate = useNavigate();
  const isOwnProfile = !params.nombre || (params.nombre && (params.nombre === (perfil.nombre || user.username)));

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImage = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setForm({ ...form, imagen: ev.target.result });
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setPerfil(form);
    setEdit(false);
  };

  const isAlumno = user.role === 'alumno';

  if (editable || edit) {
    return (
      <div className="card shadow-sm" style={{background:'#fff', borderRadius:12, minHeight:'calc(100vh - 90px)', height:'100%', position:'sticky', top:70}}>
        <div className="card-body d-flex flex-column align-items-center justify-content-center w-100 h-100">
          <div className="mb-2 position-relative">
            <img src={form.imagen || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.nombre || user.username)}&background=B56A6A&color=fff&size=96`} alt="avatar" className="rounded-circle border" style={{width:90, height:90, objectFit:'cover', borderColor:'#A05252'}} />
            <label className="btn btn-sm btn-outline-primary position-absolute" style={{bottom:0, right:0, borderRadius:'50%'}}>
              <input type="file" accept="image/*" style={{display:'none'}} onChange={handleImage} />
              <span style={{fontSize:18}}>✎</span>
            </label>
          </div>
          <input className="form-control mb-2" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" />
          <input className="form-control mb-2" name="correo" value={form.correo} onChange={handleChange} placeholder="Correo" />
          <input className="form-control mb-2" name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" />
          {isAlumno && <>
            <input className="form-control mb-2" name="escuela" value={form.escuela} onChange={handleChange} placeholder="Escuela" />
            <input className="form-control mb-2" name="seccion" value={form.seccion} onChange={handleChange} placeholder="Sección" />
          </>}
          <button className="btn btn-outline-secondary btn-sm mb-2" onClick={()=>setShowMore(v=>!v)}>{showMore ? 'Ocultar' : 'Más información'}</button>
          {showMore && <>
            <textarea className="form-control mb-2" name="masInfo" value={form.masInfo||''} onChange={handleChange} placeholder="Más información" rows={2} />
            <input className="form-control mb-2" name="horario" value={form.horario||''} onChange={handleChange} placeholder="Horarios de preferencia para contactar" />
          </>}
          <button className="btn btn-primary w-100 mt-2" onClick={handleSave}>Guardar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm mt-4" style={{background:'#fff', borderRadius:12}}>
      <div className="card-body text-center">
        <div className="mb-2 position-relative d-flex flex-column align-items-center">
          <img src={perfil.imagen || `https://ui-avatars.com/api/?name=${encodeURIComponent(perfil.nombre || user.username)}&background=B56A6A&color=fff&size=96`} alt="avatar" className="rounded-circle border" style={{width:70, height:70, objectFit:'cover', borderColor:'#A05252'}} />
        </div>
        <h6 className="mb-1" style={{color:'#5C2B2B'}}>{params.nombre || perfil.nombre || user.username}</h6>
        <div className="mb-1" style={{fontWeight:500, color:'#A05252'}}>{user.role === 'profesor' ? 'Profesor' : 'Alumno'}</div>
        {perfil.escuela && <div style={{fontSize:'0.95em', color:'#888'}}>Escuela: {perfil.escuela}</div>}
        {perfil.seccion && <div style={{fontSize:'0.95em', color:'#888'}}>Sección: {perfil.seccion}</div>}
        {perfil.correo && <div style={{fontSize:'0.95em', color:'#888'}}>Correo: {perfil.correo}</div>}
        {perfil.telefono && <div style={{fontSize:'0.95em', color:'#888'}}>Teléfono: {perfil.telefono}</div>}
        {perfil.masInfo && <div style={{fontSize:'0.95em', color:'#888'}}>Más información: {perfil.masInfo}</div>}
        {perfil.horario && <div style={{fontSize:'0.95em', color:'#888'}}>Horario: {perfil.horario}</div>}
        {showEditButton && isOwnProfile && setPerfil && (
          <button className="btn btn-outline-primary btn-sm mt-3" onClick={()=>navigate('/perfil')}>Editar perfil</button>
        )}
      </div>
    </div>
  );
}

export default Perfil;
