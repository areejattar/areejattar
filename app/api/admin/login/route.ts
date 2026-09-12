import { NextResponse } from "next/server";
import { createHmac } from "crypto";
export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  const secret = process.env.ADMIN_PASSWORD || "";
  if (!secret || password !== secret)
    return NextResponse.json({ ok: false }, { status: 401 });
  const token = createHmac("sha256", secret)
    .update("areej-admin-session")
    .digest("hex");
  const res = NextResponse.json({ ok: true });
  res.cookies.set("areej_admin", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("areej_admin", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
