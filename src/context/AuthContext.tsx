import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiFetch, getStoredToken, setStoredToken } from '../lib/api';
import { Language, User } from '../types';
import { getTranslations } from '../i18n/translations';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  language: Language;
  largeText: boolean;
  highContrast: boolean;
  t: ReturnType<typeof getTranslations>;
  setLanguage: (lang: Language) => Promise<void>;
  setAccessibility: (opts: { large_text?: boolean; high_contrast?: boolean }) => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  signup: (fullName: string, email: string, password: string, confirmPassword: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PUBLIC_LANG_KEY = 'elderease_public_lang';
const PUBLIC_LARGE_TEXT_KEY = 'elderease_large_text';
const PUBLIC_HIGH_CONTRAST_KEY = 'elderease_high_contrast';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLangState] = useState<Language>(() => {
    try {
      return localStorage.getItem(PUBLIC_LANG_KEY) === 'ml' ? 'ml' : 'en';
    } catch {
      return 'en';
    }
  });
  const [largeText, setLargeTextState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PUBLIC_LARGE_TEXT_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PUBLIC_HIGH_CONTRAST_KEY) === '1';
    } catch {
      return false;
    }
  });

  // Sync accessibility classes on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (largeText) root.classList.add('ee-large-text');
    else root.classList.remove('ee-large-text');

    if (highContrast) root.classList.add('ee-high-contrast');
    else root.classList.remove('ee-high-contrast');

    root.lang = language === 'ml' ? 'ml' : 'en';
  }, [largeText, highContrast, language]);

  const applyUserPreferences = useCallback((u: User) => {
    setLangState(u.language);
    setLargeTextState(u.large_text);
    setHighContrastState(u.high_contrast);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch<{ user: User }>('/api/auth/me');
      setUser(data.user);
      applyUserPreferences(data.user);
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [applyUserPreferences]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await apiFetch<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(data.token);
    setUser(data.user);
    applyUserPreferences(data.user);
    return data.user;
  };

  const signup = async (
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<User> => {
    const data = await apiFetch<{ user: User; token: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, confirmPassword }),
    });
    setStoredToken(data.token);
    setUser(data.user);
    applyUserPreferences(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    setStoredToken(null);
    setUser(null);
  };

  const updateProfile = async (patch: Partial<User>): Promise<User> => {
    const data = await apiFetch<{ user: User }>('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setUser(data.user);
    applyUserPreferences(data.user);
    return data.user;
  };

  const setLanguage = async (lang: Language) => {
    setLangState(lang);
    try {
      localStorage.setItem(PUBLIC_LANG_KEY, lang);
    } catch {
      // Ignore
    }
    if (user) {
      const data = await apiFetch<{ user: User }>('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ language: lang }),
      });
      setUser(data.user);
    }
  };

  const setAccessibility = async (opts: { large_text?: boolean; high_contrast?: boolean }) => {
    if (opts.large_text !== undefined) {
      setLargeTextState(opts.large_text);
      try {
        localStorage.setItem(PUBLIC_LARGE_TEXT_KEY, opts.large_text ? '1' : '0');
      } catch {
        // Ignore
      }
    }
    if (opts.high_contrast !== undefined) {
      setHighContrastState(opts.high_contrast);
      try {
        localStorage.setItem(PUBLIC_HIGH_CONTRAST_KEY, opts.high_contrast ? '1' : '0');
      } catch {
        // Ignore
      }
    }
    if (user) {
      const data = await apiFetch<{ user: User }>('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify(opts),
      });
      setUser(data.user);
    }
  };

  const t = getTranslations(language);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        language,
        largeText,
        highContrast,
        t,
        setLanguage,
        setAccessibility,
        login,
        signup,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
