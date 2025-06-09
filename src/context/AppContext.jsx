// src/context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { getDoc, doc } from 'firebase/firestore';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Estado global
  const [user, setUserState] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [cursos, setCursos] = useState([]);
  const [perfil, setPerfil] = useState({
    nombre: '', correo: '', telefono: '', escuela: '', seccion: '', imagen: '', codigo: ''
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Setters con persistencia
  const setUser = (u) => {
    setUserState(u);
    if (u) {
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      localStorage.removeItem('user');
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Verifica si el usuario guardado existe en Firestore
  useEffect(() => {
    async function checkUserExists() {
      if (user && user.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
          if (!userDoc.exists()) {
            setUser(null);
          }
        } catch (e) {
          setUser(null);
        }
      }
    }
    checkUserExists();
    // Solo al montar
    // eslint-disable-next-line
  }, []);

  // ...puedes agregar aquí los efectos de perfil/cursos si lo deseas...

  return (
    <AppContext.Provider value={{ user, setUser, cursos, setCursos, perfil, setPerfil, darkMode, setDarkMode }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
