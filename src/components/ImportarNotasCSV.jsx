import React, { useState } from 'react';
import Papa from 'papaparse';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export default function ImportarNotasCSV({ cursoId }) {
  const [csvData, setCsvData] = useState([]);
  const [columnas, setColumnas] = useState([]);
  const [preview, setPreview] = useState(false);
  const [importando, setImportando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        setColumnas(Object.keys(results.data[0] || {}));
        setPreview(true);
        setMensaje('');
      }
    });
  };

  // Busca la inscripción del alumno por código y cursoId
  const buscarInscripcion = async (codigo) => {
    const q = query(collection(db, 'inscripciones'), where('codigo', '==', codigo), where('cursoId', '==', cursoId));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0];
    return null;
  };

  const handleImportar = async () => {
    setImportando(true);
    let count = 0;
    for (const row of csvData) {
      const codigo = row.codigo || row.CODIGO || row.Codigo;
      if (!codigo) continue;
      const inscDoc = await buscarInscripcion(codigo);
      if (inscDoc) {
        // Solo toma las columnas que no sean codigo
        const notas = {};
        columnas.forEach(col => {
          if (col.toLowerCase() !== 'codigo' && row[col] !== undefined && row[col] !== '') {
            notas[col] = row[col];
          }
        });
        await updateDoc(doc(db, 'inscripciones', inscDoc.id), { notas });
        count++;
      }
    }
    setImportando(false);
    setMensaje(`Importación completada. Se actualizaron ${count} inscripciones.`);
    setPreview(false);
    setCsvData([]);
  };

  return (
    <div className="card p-3 mb-4">
      <h5>Importar notas desde CSV</h5>
      <input type="file" accept=".csv" className="form-control mb-2" onChange={handleFile} />
      {preview && (
        <div>
          <h6>Vista previa:</h6>
          <div style={{overflowX:'auto'}}>
            <table className="table table-bordered">
              <thead>
                <tr>
                  {columnas.map(col => <th key={col}>{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {csvData.slice(0,5).map((row, i) => (
                  <tr key={i}>
                    {columnas.map(col => <td key={col}>{row[col]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-muted mb-2">Solo se muestran las primeras 5 filas.</div>
          </div>
          <button className="btn btn-success" onClick={handleImportar} disabled={importando}>{importando ? 'Importando...' : 'Importar notas'}</button>
        </div>
      )}
      {mensaje && <div className="alert alert-info mt-2">{mensaje}</div>}
    </div>
  );
}
