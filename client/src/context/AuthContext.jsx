import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const handleLogout = () => logout();
    const handleLogin = () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken && storedToken !== token) {
        setToken(storedToken);
      }
    };
    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:login', handleLogin);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:login', handleLogin);
    };
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (error) {
      console.error('Failed to fetch user:', error.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);