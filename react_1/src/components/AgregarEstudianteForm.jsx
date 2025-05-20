// Formulario modularizado para agregar estudiante y notas en ProfesorPanel
import React from 'react';

/**
 * Formulario para agregar un estudiante y sus notas a un curso.
 * @param {Object} props
 * @param {string} nuevoEstudiante
 * @param {function} setNuevoEstudiante
 * @param {Object} notas
 * @param {function} setNotas
 * @param {Array} notasExtras
 * @param {function} handleNotaExtraChange
 * @param {function} agregarNotaExtra
 * @param {function} agregarEstudiante
 * @param {string} errorEstudiante
 */
export default function AgregarEstudianteForm({
  nuevoEstudiante,
  setNuevoEstudiante,
  notas,
  setNotas,
  notasExtras,
  handleNotaExtraChange,
  agregarNotaExtra,
  agregarEstudiante,
  errorEstudiante
}) {
  return (
    <div className="input-group mb-2">
      <input
        type="text"
        className="form-control"
        placeholder="Nombre del estudiante"
        value={nuevoEstudiante}
        onChange={e => setNuevoEstudiante(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'ArrowRight' || e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('input-pc1')?.focus();
          }
        }}
      />
      <input
        id="input-pc1"
        type="number"
        className="form-control"
        placeholder="PC1"
        value={notas.pc1}
        onChange={e => setNotas({ ...notas, pc1: e.target.value })}
        onKeyDown={e => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            document.querySelector('input[placeholder=\'Nombre del estudiante\']')?.focus();
          } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('input-pc2')?.focus();
          }
        }}
      />
      <input
        id="input-pc2"
        type="number"
        className="form-control"
        placeholder="PC2"
        value={notas.pc2}
        onChange={e => setNotas({ ...notas, pc2: e.target.value })}
        onKeyDown={e => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            document.getElementById('input-pc1')?.focus();
          } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('input-parcial')?.focus();
          }
        }}
      />
      <input
        id="input-parcial"
        type="number"
        className="form-control"
        placeholder="Parcial"
        value={notas.parcial}
        onChange={e => setNotas({ ...notas, parcial: e.target.value })}
        onKeyDown={e => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            document.getElementById('input-pc2')?.focus();
          } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('input-final')?.focus();
          }
        }}
      />
      <input
        id="input-final"
        type="number"
        className="form-control"
        placeholder="Final"
        value={notas.final}
        onChange={e => setNotas({ ...notas, final: e.target.value })}
        onKeyDown={e => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            document.getElementById('input-parcial')?.focus();
          } else if ((e.key === 'ArrowRight' || e.key === 'Enter') && document.getElementById('input-opc1')) {
            e.preventDefault();
            document.getElementById('input-opc1')?.focus();
          }
        }}
      />
      {notasExtras.map((nota, idx) => (
        <input
          key={nota.nombre}
          id={`input-${nota.nombre}`}
          type="number"
          className="form-control"
          placeholder={nota.label}
          value={nota.valor}
          onChange={e => handleNotaExtraChange(idx, e.target.value)}
          onKeyDown={e => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              if (idx === 0) {
                document.getElementById('input-final')?.focus();
              } else {
                document.getElementById(`input-${notasExtras[idx-1].nombre}`)?.focus();
              }
            } else if ((e.key === 'ArrowRight' || e.key === 'Enter') && idx < notasExtras.length - 1) {
              e.preventDefault();
              document.getElementById(`input-${notasExtras[idx+1].nombre}`)?.focus();
            }
          }}
        />
      ))}
      <button className="btn btn-secondary" type="button" onClick={agregarNotaExtra}>+ Nota</button>
      <button className="btn btn-primary" type="button" onClick={agregarEstudiante}>Agregar Estudiante</button>
      {errorEstudiante && (
        <div className="alert alert-danger my-2">{errorEstudiante}</div>
      )}
    </div>
  );
}
