type AuthRole = 'customer' | 'photographer' | null;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** ID thực tế trong JWT — khớp senderId từ API/SignalR (customer_id / photographer_id / user_id). */
export function getUserIdFromAccessToken(token: string, role?: AuthRole | string | null): string {
  const payload = decodeJwtPayload(token);
  if (!payload) return '';

  const nameIdentifier =
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

  const roleSpecific =
    role === 'photographer'
      ? payload.photographer_id
      : role === 'customer'
        ? payload.customer_id
        : payload.photographer_id ?? payload.customer_id;

  const raw =
    roleSpecific
    ?? payload.user_id
    ?? payload.sub
    ?? nameIdentifier
    ?? '';

  return String(raw).toLowerCase();
}

export function normalizeUserId(id: string | undefined | null): string {
  return (id ?? '').trim().toLowerCase();
}

export function isMyMessage(senderId: string, currentUserId: string): boolean {
  const me = normalizeUserId(currentUserId);
  return me.length > 0 && normalizeUserId(senderId) === me;
}
