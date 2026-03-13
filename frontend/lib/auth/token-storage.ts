const TOKEN_KEY = "prakriti.access_token";
const AUTH_COOKIE = "pa_token";

export function getTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setTokenInStorage(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=604800; samesite=lax`;
}

export function clearTokenFromStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${AUTH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
}

export { AUTH_COOKIE, TOKEN_KEY };
