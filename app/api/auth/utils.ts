/**
 * Local-only auth: single local user. No external auth provider.
 */
import { User } from '@/app/types';
import { getLocalUser } from '../shared/local-user';

export async function getLocalUserForAuth(_token: string): Promise<User | null> {
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

export function isAuthorized(_user: User): boolean {
  return true;
}

export function clearUserCache() {
  // no-op
}
