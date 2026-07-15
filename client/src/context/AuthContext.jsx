import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import i18n from 'i18next';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser?.user_metadata?.language) {
        const lang = activeUser.user_metadata.language;
        localStorage.setItem('language', lang);
        i18n.changeLanguage(lang);
      }
      setBooting(false);
    }).catch((err) => {
      console.error('Supabase auth error:', err);
      setBooting(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser?.user_metadata?.language) {
        const lang = activeUser.user_metadata.language;
        localStorage.setItem('language', lang);
        i18n.changeLanguage(lang);
      }
      setBooting(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      async changeLanguage(lang) {
        localStorage.setItem('language', lang);
        i18n.changeLanguage(lang);
        if (user) {
          try {
            await supabase.auth.updateUser({
              data: { language: lang }
            });
            await api.updateProfile({ language: lang });
          } catch (err) {
            console.error('Failed to sync language selection:', err);
          }
        }
      },
      async login({ email, password }) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Sync language from user metadata after login
        if (data.user?.user_metadata?.language) {
          const lang = data.user.user_metadata.language;
          localStorage.setItem('language', lang);
          i18n.changeLanguage(lang);
        } else {
          // If metadata language doesn't exist, save local storage language to remote
          const localLang = localStorage.getItem('language') || 'en';
          await supabase.auth.updateUser({ data: { language: localLang } }).catch(() => {});
          await api.updateProfile({ language: localLang }).catch(() => {});
        }
        return data;
      },
      async register({ email, password, name }) {
        const localLang = localStorage.getItem('language') || 'en';
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              language: localLang
            }
          }
        });
        if (error) throw error;
        return data;
      },
      async loginWithGoogle() {
        const localLang = localStorage.getItem('language') || 'en';
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/app/dashboard',
            data: {
              language: localLang
            }
          }
        });
        if (error) throw error;
        return data;
      },
      async refreshUser() {
        const { data: { user: updatedUser } } = await supabase.auth.getUser();
        setUser(updatedUser);
        if (updatedUser?.user_metadata?.language) {
          const lang = updatedUser.user_metadata.language;
          localStorage.setItem('language', lang);
          i18n.changeLanguage(lang);
        }
      },
      async logout() {
        await supabase.auth.signOut();
      }
    }),
    [user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
