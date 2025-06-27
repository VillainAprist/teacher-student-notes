import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

function PerfilUsuario() {
  const { uid } = useParams();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPerfil() {
      const docSnap = await getDoc(doc(db, "usuarios", uid));
      if (docSnap.exists()) setPerfil(docSnap.data());
      setLoading(false);
    }
    fetchPerfil();
  }, [uid]);

  if (loading) return <div className="text-center mt-5">Cargando perfil...</div>;
  if (!perfil) return <div className="text-center mt-5">Perfil no encontrado.</div>;

  return (
    <div className="card mx-auto my-5 shadow" style={{maxWidth: 500, borderRadius: 16}}>
      <div className="card-body">
        <h4 className="fw-bold mb-0">{perfil.nombre}</h4>
        <div className="text-muted small">{perfil.correo || perfil.email || 'Sin correo'}</div>
        <div className="text-muted small">Código: {perfil.codigo || 'Sin código'}</div>
        <div className="mt-3">
          {perfil.role === "profesor" ? (
            <>
              <div><b>Departamento académico:</b> {perfil.departamento || "Sin departamento"}</div>
              <div><b>Categoría:</b> {perfil.categoria || "Sin categoría"}</div>
              <div><b>Grado académico:</b> {perfil.grado || "Sin grado"}</div>
            </>
          ) : perfil.role === "alumno" ? (
            <>
              <div><b>Escuela:</b> {perfil.escuela || "Sin escuela"}</div>
              <div><b>Sección:</b> {perfil.seccion || "Sin sección"}</div>
            </>
          ) : null}
          <div><b>Teléfono:</b> {perfil.telefono || "Sin teléfono"}</div>
          <div><b>Descripción:</b> {perfil.masInfo || "Sin descripción"}</div>
        </div>
      </div>
    </div>
  );
}

export default PerfilUsuario;
