// Componente para alternar entre modo claro y oscuro
import React from 'react';

export default function ThemeSwitcher({ darkMode, setDarkMode }) {
  return (
    <button
      className={`btn ${darkMode ? 'btn-light' : 'btn-dark'} me-2`}
      onClick={() => setDarkMode(dm => !dm)}
      title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      style={{ minWidth: 40 }}
    >
      {darkMode ? (
        <span role="img" aria-label="Sol">🌞</span>
      ) : (
        <span role="img" aria-label="Luna">🌙</span>
      )}
    </button>
  );
}
