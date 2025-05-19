import { useState } from 'react';

/**
 * Hook para manejar formularios controlados de manera reutilizable.
 * @param {Object} initialValues - Estado inicial del formulario.
 * @returns {[Object, function, function]} [form, handleChange, setForm]
 */
export function useForm(initialValues) {
  const [form, setForm] = useState(initialValues);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return [form, handleChange, setForm];
}
