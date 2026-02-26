'use client';

import { getLocalUser } from '@/app/api/shared/local-user';
import { User } from '@/app/types';
import { createContext, ReactNode, useContext } from 'react';

function createLocalUser(): User {
  const local = getLocalUser();
  return {
    userId: local.userId,
    name: local.name,
    displayName: local.displayName,
    imageUrl: null,
    projects: [],
    playthroughs: [],
  };
}

export interface AuthContextType {
  user: User;
  loading: false;
  signInWithGoogle: () => Promise<void>;
  signInWithDiscord: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (_: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = createLocalUser();

  const value: AuthContextType = {
    user,
    loading: false,
    signInWithGoogle: async () => {},
    signInWithDiscord: async () => {},
    logout: async () => {},
    updateUser: async () => {},
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
