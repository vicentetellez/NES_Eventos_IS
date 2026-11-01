import { createContext, useContext, useState, useEffect } from 'react';
import {
  login as loginService,
  logout as logoutService,
  me as getCurrentUser,
} from '../services/auth.service.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (active) {
          setUser(currentUser);
        }
      } catch (error) {
        if (!active) return;

        if (error.status !== 401 && error.status !== 403) {
          console.error(error.message, error);
          setAuthError(error.message);
        }
        setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    initAuth();

    return () => {
      active = false;
    };
  }, []);

  const login = async (rut, password) => {
    try {
      await loginService({ rut, password });
      const userData = await getCurrentUser();
      setUser(userData);
      setAuthError(null);

      return { success: true, user: userData };
    } catch (error) {
      return { success: false, message: error.message || 'Credenciales inválidas' };
    }
  };

  const logout = async () => {
    try {
      await logoutService();
      setUser(null);
      setAuthError(null);
      return { success: true };
    } catch (error) {
      const message = error.message || 'Error al cerrar sesión';

      if (error.status === 401 || error.status === 403) {
        setUser(null);
      }

      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};