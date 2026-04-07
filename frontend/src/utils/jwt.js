export function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isJwtExpired(payload, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!payload || typeof payload !== 'object') return true;
  if (typeof payload.exp !== 'number') return false;
  return payload.exp <= nowSeconds;
}

