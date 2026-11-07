import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Publish all saved product drafts and site settings in one transaction.
export async function POST() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const configLock = await client.query(
      "SELECT id FROM public.site_config WHERE id = 1 FOR UPDATE"
    );
    if (configLock.rowCount !== 1) {
      throw new Error("Site configuration row (id = 1) is missing.");
    }

    const products = await client.query(
      `UPDATE public.products
       SET published_data = draft_data, published_at = NOW()
       WHERE draft_data IS NOT NULL`
    );

    const settings = await client.query(
      `UPDATE public.site_config
       SET published_config = draft_config, published_updated_at = NOW()
       WHERE id = 1`
    );
    if (settings.rowCount !== 1) {
      throw new Error("Unable to publish site configuration.");
    }

    await client.query("COMMIT");
    return NextResponse.json(
      {
        success: true,
        message: "All product and site-setting drafts were published.",
        productsPublished: products.rowCount ?? 0,
        settingsPublished: true,
        publishedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Admin publish error:", error);
    return NextResponse.json(
      { success: false, message: "Publishing failed. No changes were published." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  } finally {
    client.release();
  }
}
