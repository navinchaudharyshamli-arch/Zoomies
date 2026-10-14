import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile } from '../types';
import { api, isDemoMode } from '../lib';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  isDemo: boolean;
  login: (email: string, pass: string) => Promise<Profile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const current = await api.getCurrentUser();
      setUser(current);
    } catch (e) {
      console.error('Failed to load user', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string): Promise<Profile> => {
    const loggedIn = await api.login(email, pass);
    setUser(loggedIn);
    return loggedIn;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemo: isDemoMode, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
