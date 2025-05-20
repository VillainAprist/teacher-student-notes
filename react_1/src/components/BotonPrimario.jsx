// Componente reutilizable de botón primario
/**
 * Botón primario reutilizable para la app.
 * @param {object} props
 * @param {React.ReactNode} props.children - Contenido del botón
 * @param {function} [props.onClick] - Función al hacer clic
 * @param {string} [props.type] - Tipo de botón (button, submit, etc.)
 * @param {string} [props.className] - Clases adicionales
 * @returns {JSX.Element}
 */
export default function BotonPrimario({ children, onClick, type = 'button', className = '', ...props }) {
  return (
    <button
      type={type}
      className={`btn btn-primary ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
