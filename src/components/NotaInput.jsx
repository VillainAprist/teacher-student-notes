// src/components/NotaInput.jsx
import React from 'react';

/**
 * Input de nota reutilizable para tablas de edición de notas.
 * @param {string} value - Valor de la nota
 * @param {function} onChange - Handler de cambio
 * @param {string} [placeholder] - Placeholder opcional
 * @param {string} [id] - ID opcional para accesibilidad y navegación
 */
export default function NotaInput({ value, onChange, placeholder, id, name, tabIndex, autoFocus }) {
  // Ref para el input
  const inputRef = React.useRef();

  // Maneja el movimiento con flechas entre inputs
  const handleKeyDown = (e) => {
    if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)) {
      const form = e.target.form;
      const elements = Array.from(form.elements).filter(el => el.tagName === 'INPUT' && el.type === 'number');
      const index = elements.indexOf(e.target);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        elements[index + 1]?.focus();
        e.preventDefault();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        elements[index - 1]?.focus();
        e.preventDefault();
      }
    }
  };

  return (
    <input
      ref={inputRef}
      type="number"
      className="form-control"
      value={value === undefined || value === null ? '' : value}
      onChange={onChange}
      placeholder={placeholder}
      id={id}
      name={name}
      tabIndex={tabIndex}
      autoFocus={autoFocus}
      min={0}
      max={20}
      step={0.01}
      style={{ minWidth: 60 }}
      onKeyDown={handleKeyDown}
    />
  );
}
