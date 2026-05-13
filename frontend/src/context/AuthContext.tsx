import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  balance?: number;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('vision_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('vision_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vision_user');
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:8001/api/admin/users`);
      if (res.ok) {
        const users = await res.json();
        const me = users.find((u: any) => u.email === user.email);
        if (me) {
          const updated = { ...user, balance: me.balance, role: me.role };
          setUser(updated);
          localStorage.setItem('vision_user', JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.error("Failed to refresh user data", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
