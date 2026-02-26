import { User } from '@/app/types';

export interface DbUser {
  userId: string;
  displayName: string;
  imageUrl: string | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithDiscord: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userUpdates: Partial<User>) => Promise<void>;
}
