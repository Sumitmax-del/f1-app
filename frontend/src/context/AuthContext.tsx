'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  favouriteTeam: string;
  favouriteDriver: string;
  profileImage?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  signup: (userData: any) => Promise<{ success: boolean; error?: string }>;
  login: (credentials: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resendVerification: () => Promise<{ success: boolean; message?: string; error?: string }>;
  fetchWithAuth: (endpoint: string, options?: RequestInit) => Promise<any>;
  updateFavorites: (favorites: { favouriteDriver?: string; favouriteTeam?: string }) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Load token from localStorage on mount and fetch current user profile
  useEffect(() => {
    async function loadUser() {
      try {
        const storedToken = localStorage.getItem('f1_auth_token');
        if (!storedToken) {
          setLoading(false);
          return;
        }

        setToken(storedToken);
        
        // Fetch current user details
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data.user) {
            setUser(json.data.user);
          } else {
            // Invalid token
            localStorage.removeItem('f1_auth_token');
            setToken(null);
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem('f1_auth_token');
          setToken(null);
        }
      } catch (err) {
        console.error('[AuthContext] Load user error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  // API Request Wrapper with Auth token
  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const currentToken = token || localStorage.getItem('f1_auth_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Auto logout on unauthorized session
      logout();
      throw new Error('Session expired. Please sign in again.');
    }

    return res;
  };

  // Sign up
  const signup = async (userData: any) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed.' };
      }

      const { token: receivedToken, user: receivedUser } = data.data;
      localStorage.setItem('f1_auth_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'An unexpected connection error occurred.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Log in
  const login = async (credentials: any) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Login failed.' };
      }

      const { token: receivedToken, user: receivedUser } = data.data;
      localStorage.setItem('f1_auth_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);

      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'An unexpected connection error occurred.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Log out
  const logout = () => {
    localStorage.removeItem('f1_auth_token');
    setToken(null);
    setUser(null);
    setError(null);
    router.push('/login');
  };

  // Resend verification
  const resendVerification = async () => {
    try {
      const res = await fetchWithAuth('/api/auth/resend-verification', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to resend verification email.' };
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection failure.' };
    }
  };

  // Update F1 Favourites
  const updateFavorites = async (favorites: { favouriteDriver?: string; favouriteTeam?: string }) => {
    try {
      const res = await fetchWithAuth('/api/auth/favorites', {
        method: 'POST',
        body: JSON.stringify(favorites),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to update favorites.' };
      }
      setUser(data.data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection failure.' };
    }
  };

  // Forgot password dispatcher
  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to request reset.' };
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection failure.' };
    }
  };

  // Reset password controller
  const resetPassword = async (tokenStr: string, passwordStr: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenStr, password: passwordStr }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to reset password.' };
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection failure.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        signup,
        login,
        logout,
        resendVerification,
        fetchWithAuth,
        updateFavorites,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
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
