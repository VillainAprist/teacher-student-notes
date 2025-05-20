// src/components/NotaInput.jsx
import React from 'react';

/**
 * Input de nota reutilizable para tablas de edición de notas.
 * @param {string} value - Valor de la nota
 * @param {function} onChange - Handler de cambio
 * @param {string} [placeholder] - Placeholder opcional
 * @param {string} [id] - ID opcional para accesibilidad y navegación
 */
export default function NotaInput({ value, onChange, placeholder, id }) {
  return (
    <input
      type="number"
      className="form-control"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      id={id}
      min={0}
      max={20}
      step={0.01}
      style={{ minWidth: 60 }}
    />
  );
}
