import { NextRequest, NextResponse } from "next/server";

const UNLOCK_PASSWORD = "ceramika2025";
const COOKIE_NAME = "preview_access";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/coming-soon") {
    return NextResponse.next();
  }

  const unlockParam = searchParams.get("unlock");
  if (unlockParam === UNLOCK_PASSWORD) {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(COOKIE_NAME, "true", {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  }

  const hasAccess = request.cookies.get(COOKIE_NAME)?.value === "true";
  if (!hasAccess) {
    return NextResponse.redirect(new URL("/coming-soon", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
