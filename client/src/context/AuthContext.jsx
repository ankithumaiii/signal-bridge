import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('signal_bridge_user') || 'null');
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(getAuthToken());
  const [loading, setLoading] = useState(!getAuthToken() ? false : true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      if (!getAuthToken()) {
        setLoading(false);
        return;
      }
      const data = await api.getMe();
      if (data.success && data.user) {
        setUser(data.user);
        try {
          localStorage.setItem('signal_bridge_user', JSON.stringify(data.user));
        } catch {}
      } else {
        logout();
      }
    } catch (err) {
      // If network error/timeout/offline, keep cached user so app is never stuck
      if (err.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    if (data.token) {
      setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
      try {
        localStorage.setItem('signal_bridge_user', JSON.stringify(data.user));
      } catch {}
    }
    return data;
  };

  const demoLogin = async () => {
    return login('demo@signalbridge.org', 'demo12345');
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    if (data.token) {
      setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
      try {
        localStorage.setItem('signal_bridge_user', JSON.stringify(data.user));
      } catch {}
    }
    return data;
  };

  const logout = () => {
    setIsLoggingOut(true);
    removeAuthToken();
    try {
      localStorage.removeItem('signal_bridge_user');
    } catch {}
    setToken(null);
    setUser(null);
    setTimeout(() => {
      setIsLoggingOut(false);
    }, 1000);
  };

  const updateProfile = async (updates) => {
    const data = await api.updateProfile(updates);
    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        isLoggingOut,
        login,
        demoLogin,
        register,
        logout,
        updateProfile,
        refreshMe: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
