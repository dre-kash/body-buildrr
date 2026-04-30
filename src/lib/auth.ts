import { User } from './types';

const USERS_KEY = 'bb_users';
const CURRENT_KEY = 'bb_current_user';

function hashPassword(password: string): string {
  // djb2 hash — local-only storage, no network transmission
  let hash = 5381;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) + hash + password.charCodeAt(i);
    hash = hash & hash; // 32-bit
  }
  return Math.abs(hash).toString(36);
}

export function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_KEY);
}

export function getCurrentUser(): User | null {
  const id = getCurrentUserId();
  if (!id) return null;
  return getUsers().find((u) => u.id === id) ?? null;
}

export function signup(
  name: string,
  email: string,
  password: string
): { user: User } | { error: string } {
  const users = getUsers();
  const normalised = email.trim().toLowerCase();
  if (users.find((u) => u.email === normalised)) {
    return { error: 'An account with that email already exists.' };
  }
  const user: User = {
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    email: normalised,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  saveUsers([...users, user]);
  localStorage.setItem(CURRENT_KEY, user.id);
  return { user };
}

export function login(
  email: string,
  password: string
): { user: User } | { error: string } {
  const users = getUsers();
  const normalised = email.trim().toLowerCase();
  const user = users.find((u) => u.email === normalised);
  if (!user) return { error: 'No account found with that email.' };
  if (user.passwordHash !== hashPassword(password)) {
    return { error: 'Incorrect password.' };
  }
  localStorage.setItem(CURRENT_KEY, user.id);
  return { user };
}

export function logout(): void {
  localStorage.removeItem(CURRENT_KEY);
}

export function storageKey(base: string, userId: string): string {
  return `${base}_${userId}`;
}
