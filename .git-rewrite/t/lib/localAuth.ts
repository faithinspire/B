// Local authentication system - bypasses Supabase for now
// This is a temporary solution to get the app working immediately

interface LocalUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: 'customer' | 'braider' | 'admin';
  created_at: string;
}

const STORAGE_KEY = 'braidly_users';
const SESSION_KEY = 'braidly_session';

// Get all users from localStorage
function getAllUsers(): LocalUser[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// Save users to localStorage
function saveUsers(users: LocalUser[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// Get current session
export function getSession() {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
}

// Set session
export function setSession(user: LocalUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  // Also set a cookie for middleware - encode to avoid issues with special characters
  const encodedSession = encodeURIComponent(JSON.stringify(user));
  document.cookie = `braidly_session=${encodedSession}; path=/; max-age=86400; SameSite=Lax`;
}

// Clear session
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
  // Clear cookie
  document.cookie = 'braidly_session=; path=/; max-age=0';
}

// Sign up
export async function localSignUp(
  email: string,
  password: string,
  fullName: string,
  role: 'customer' | 'braider' | 'admin'
): Promise<LocalUser> {
  const users = getAllUsers();

  // Check if user already exists
  if (users.some((u) => u.email === email)) {
    throw new Error('Email already registered');
  }

  // Create new user
  const newUser: LocalUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    password, // In production, this should be hashed
    full_name: fullName,
    role,
    created_at: new Date().toISOString(),
  };

  // Save user
  users.push(newUser);
  saveUsers(users);

  // Set session
  setSession(newUser);

  return newUser;
}

// Sign in
export async function localSignIn(email: string, password: string): Promise<LocalUser> {
  const users = getAllUsers();
  const user = users.find((u) => u.email === email);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (user.password !== password) {
    throw new Error('Invalid email or password');
  }

  // Set session
  setSession(user);

  return user;
}

// Sign out
export function localSignOut(): void {
  clearSession();
}

// Get current user
export function getCurrentUser(): LocalUser | null {
  return getSession();
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getSession() !== null;
}
