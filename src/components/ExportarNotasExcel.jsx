import React from 'react';
import * as XLSX from 'xlsx';

export default function ExportarNotasExcel({ alumnos = [], notasExtras = [] }) {
  const handleExportar = () => {
    if (!alumnos.length) return;
    // Detectar todas las columnas de notas presentes
    const allNotas = ['pc1', 'pc2', 'parcial', 'final', ...notasExtras.map(n => n.nombre)];
    // Construir los datos para exportar
    const data = alumnos.map(al => {
      const row = {
        nombre: al.nombre || al.alumnoNombre || '',
        codigo: al.codigo || al.alumnoCodigo || '',
      };
      allNotas.forEach(nota => {
        row[nota] = (al.notas && al.notas[nota] !== undefined) ? al.notas[nota] : '';
      });
      return row;
    });
    // Crear hoja y libro
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Notas');
    // Descargar
    XLSX.writeFile(wb, 'notas_curso.xlsx');
  };

  return (
    <button className="btn btn-outline-primary mb-3" onClick={handleExportar} disabled={!alumnos.length}>
      Exportar notas a Excel
    </button>
  );
}
