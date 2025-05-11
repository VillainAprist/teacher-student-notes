function AlumnoPanel({ cursos, alumno }) {
  return (
    <div className="container mt-4">
      <h2>Mis Notas</h2>
      {cursos.length === 0 ? (
        <p>No hay cursos disponibles.</p>
      ) : (
        cursos.map((curso, idx) => {
          const estudiante = curso.estudiantes.find(e => e.nombre === alumno);
          return (
            <div key={idx} className="card mb-3">
              <div className="card-header">{curso.nombre}</div>
              <div className="card-body">
                {estudiante ? (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>PC1</th>
                        <th>PC2</th>
                        <th>Parcial</th>
                        <th>Final</th>
                        <th>Extras</th>
                        <th>Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{estudiante.notas.pc1}</td>
                        <td>{estudiante.notas.pc2}</td>
                        <td>{estudiante.notas.parcial}</td>
                        <td>{estudiante.notas.final}</td>
                        <td>{estudiante.notas.extras}</td>
                        <td>{((+estudiante.notas.pc1 + +estudiante.notas.pc2 + +estudiante.notas.parcial + +estudiante.notas.final + (+estudiante.notas.extras || 0)) / 5).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p>No estás inscrito en este curso.</p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default AlumnoPanel;
