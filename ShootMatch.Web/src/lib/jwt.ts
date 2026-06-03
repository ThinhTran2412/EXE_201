export interface JwtPayloadClaims {
  user_id?: string;
  customer_id?: string;
  photographer_id?: string;
  staff_id?: string;
  admin_id?: string;
  sub?: string;
  role?: string;
  [key: string]: unknown;
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

export function decodeJwtPayload(token: string): JwtPayloadClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1])) as JwtPayloadClaims;
  } catch {
    return null;
  }
}

export function resolveTokenRole(token: string): "customer" | "photographer" | "staff" | "admin" | null {
  const payload = decodeJwtPayload(token);
  const role = payload?.role;

  if (role === "customer" || role === "photographer" || role === "staff" || role === "admin") {
    return role;
  }

  return null;
}

export function resolveTokenUserId(token: string): string {
  const payload = decodeJwtPayload(token);
  return (
    (typeof payload?.user_id === "string" && payload.user_id) ||
    (typeof payload?.customer_id === "string" && payload.customer_id) ||
    (typeof payload?.photographer_id === "string" && payload.photographer_id) ||
    (typeof payload?.staff_id === "string" && payload.staff_id) ||
    (typeof payload?.admin_id === "string" && payload.admin_id) ||
    (typeof payload?.sub === "string" && payload.sub) ||
    ""
  );
}
