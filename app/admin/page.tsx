import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import AdminPanel from "@/components/AdminPanel";
function token() {
  const password = process.env.ADMIN_PASSWORD || "";
  return createHmac("sha256", password)
    .update("areej-admin-session")
    .digest("hex");
}
export default function AdminPage() {
  const expected = token();
  const actual = cookies().get("areej_admin")?.value || "";
  const ok =
    !!process.env.ADMIN_PASSWORD &&
    actual.length === expected.length &&
    timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  return <AdminPanel authenticated={ok} />;
}
