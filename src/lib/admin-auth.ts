const COOKIE_NAME = "coach_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function encoder() {
  return new TextEncoder();
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getAdminPassword(): string {
  return (process.env.ADMIN_PASSWORD || "").trim();
}

export function adminCookieName(): string {
  return COOKIE_NAME;
}

export function adminCookieMaxAge(): number {
  return MAX_AGE_SECONDS;
}

export async function createAdminToken(): Promise<string | null> {
  const secret = getAdminPassword();
  if (!secret) return null;
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `ok.${exp}`;
  const sig = await hmacHex(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifyAdminToken(token: string | undefined | null): Promise<boolean> {
  const secret = getAdminPassword();
  if (!secret || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [flag, expRaw, sig] = parts;
  if (flag !== "ok") return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = await hmacHex(secret, `${flag}.${expRaw}`);
  if (expected.length !== sig.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return mismatch === 0;
}

export function adminCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}${secure}`;
}

export function clearAdminCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function readCookie(header: string | null, name = COOKIE_NAME): string | null {
  if (!header) return null;
  const parts = header.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

export async function isAdminRequest(request: Request): Promise<boolean> {
  const token = readCookie(request.headers.get("cookie"));
  return verifyAdminToken(token);
}
