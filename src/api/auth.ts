const BASE        = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''
const TOKEN_KEY   = 'gov_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(`${BASE}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username, password }),
  })
  if (res.status === 429) throw new Error('Too many attempts — try again later')
  if (!res.ok)            throw new Error('Invalid username or password')
  const { token } = await res.json() as { token: string }
  setToken(token)
}
