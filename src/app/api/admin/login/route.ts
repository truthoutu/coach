import { NextResponse } from "next/server";
import {
  adminCookieHeader,
  createAdminToken,
  getAdminPassword,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const expected = getAdminPassword();
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not set on the server. Add it in Vercel env vars, then redeploy." },
      { status: 503 },
    );
  }

  let password = "";
  try {
    const body = await request.json();
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (password !== expected) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = await createAdminToken();
  if (!token) {
    return NextResponse.json({ error: "Could not start admin session" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", adminCookieHeader(token));
  return res;
}
