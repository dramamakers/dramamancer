/**
 * Public version: single local user, no authentication.
 * All projects and playthroughs are owned by this user.
 */
export const LOCAL_USER_ID = 'local-user';

export interface LocalUser {
  userId: string;
  name: string;
  displayName: string;
}

export function getLocalUser(): LocalUser {
  return {
    userId: LOCAL_USER_ID,
    name: 'Local User',
    displayName: 'Local User',
  };
}
