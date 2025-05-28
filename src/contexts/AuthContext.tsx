import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {  user: User | null;  session: Session | null;  loading: boolean;  currentRoomId: string | null;  setCurrentRoomId: (roomId: string | null) => void;  signOut: () => Promise<void>;}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {  const [user, setUser] = useState<User | null>(null);  const [session, setSession] = useState<Session | null>(null);  const [loading, setLoading] = useState(true);  const [currentRoomId, setCurrentRoomId] = useState<string | null>(() => {
    // LocalStorage'dan mevcut oda ID'sini al
    return localStorage.getItem('currentRoomId');
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Clear current room on sign out
      if (event === 'SIGNED_OUT') {
        setCurrentRoomId(null);
        localStorage.removeItem('currentRoomId');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // currentRoomId değiştiğinde localStorage'ı güncelle
  useEffect(() => {
    if (currentRoomId) {
      localStorage.setItem('currentRoomId', currentRoomId);
    } else {
      localStorage.removeItem('currentRoomId');
    }
  }, [currentRoomId]);

  const signOut = async () => {
    try {
      // Clean up user data from rooms before signing out
      if (user) {
        await supabase
          .from('room_users')
          .delete()
          .eq('user_id', user.id);
      }
      
      await supabase.auth.signOut();
      localStorage.removeItem('currentRoomId');
      setCurrentRoomId(null);
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

    const value = {    user,    session,    loading,    currentRoomId,    setCurrentRoomId,    signOut,  };

  return (
    <AuthContext.Provider value={value}>
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