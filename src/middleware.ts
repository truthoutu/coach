import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminPassword, readCookie, verifyAdminToken } from "@/lib/admin-auth";

function isProtectedApi(pathname: string, method: string): boolean {
  const m = method.toUpperCase();
  if (pathname.startsWith("/api/admin/")) {
    return pathname !== "/api/admin/login";
  }
  if (pathname === "/api/upload") return m !== "OPTIONS";
  if (pathname === "/api/products" || pathname.startsWith("/api/products/")) {
    return m !== "GET" && m !== "HEAD" && m !== "OPTIONS";
  }
  if (pathname === "/api/campaigns" || pathname.startsWith("/api/campaigns/")) {
    return m !== "GET" && m !== "HEAD" && m !== "OPTIONS";
  }
  if (pathname === "/api/orders" || pathname.startsWith("/api/orders/")) {
    return m !== "POST" && m !== "OPTIONS";
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";

  if (isLoginPage || isLoginApi) {
    return NextResponse.next();
  }

  const needsPageGuard = isAdminPage;
  const needsApiGuard = isProtectedApi(pathname, method);

  if (!needsPageGuard && !needsApiGuard) {
    return NextResponse.next();
  }

  if (!getAdminPassword()) {
    if (needsPageGuard) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("setup", "1");
      return NextResponse.redirect(url);
    }
    return NextResponse.json(
      { error: "Admin is locked. Set ADMIN_PASSWORD in environment variables." },
      { status: 503 },
    );
  }

  const token = readCookie(request.headers.get("cookie"));
  const ok = await verifyAdminToken(token);

  if (ok) return NextResponse.next();

  if (needsPageGuard) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/api/admin/:path*", "/api/products", "/api/campaigns", "/api/orders", "/api/upload"],
};
