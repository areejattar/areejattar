
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminSessionToken } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Safely compare username and password
function safeCompare(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

// ADMIN LOGIN
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const username =
      typeof body.username === "string" ? body.username : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    const expectedUsername = process.env.ADMIN_USERNAME || "";
    const expectedPassword = process.env.ADMIN_PASSWORD || "";

    // Validate credentials
    if (
      !expectedUsername ||
      !expectedPassword ||
      !safeCompare(username, expectedUsername) ||
      !safeCompare(password, expectedPassword)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid username or password.",
        },
        { status: 401 }
      );
    }

    // Generate authenticated session token
    const token = createAdminSessionToken();

    const response = NextResponse.json({
      ok: true,
      message: "Login successful.",
    });

    // Set secure HTTP-only session cookie
    response.cookies.set("areej_admin", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;

  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Unable to log in.",
      },
      { status: 500 }
    );
  }
}

// ADMIN LOGOUT
export async function DELETE() {
  const response = NextResponse.json({
    ok: true,
    message: "Logged out successfully.",
  });

  response.cookies.set("areej_admin", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
