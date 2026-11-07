
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_KEYS = [
  "storeAvailability",
  "merchandising",
  "discovery",
  "orderSettings",
];

function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

// GET: Load admin settings
export async function GET() {
  try {
    if (!isAdminAuthenticated()) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await query<{
      draft_config: Record<string, unknown>;
      published_config: Record<string, unknown>;
      draft_updated_at: Date;
      published_updated_at: Date;
    }>(`
      SELECT
        draft_config,
        published_config,
        draft_updated_at,
        published_updated_at
      FROM public.site_config
      WHERE id = 1
    `);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Site configuration not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        draftConfig: result.rows[0].draft_config,
        publishedConfig: result.rows[0].published_config,
        draftUpdatedAt: result.rows[0].draft_updated_at,
        publishedUpdatedAt: result.rows[0].published_updated_at,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Admin settings GET error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve admin settings." },
      { status: 500 }
    );
  }
}

// PUT: Save settings as draft only
export async function PUT(req: Request) {
  try {
    if (!isAdminAuthenticated()) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);

    if (!body || !isObject(body.draftConfig)) {
      return NextResponse.json(
        { success: false, message: "A valid draftConfig object is required." },
        { status: 400 }
      );
    }

    const draftConfig = body.draftConfig;
    const keys = Object.keys(draftConfig);

    if (keys.length === 0 || keys.some((key) => !ALLOWED_KEYS.includes(key))) {
      return NextResponse.json(
        { success: false, message: "Invalid settings configuration keys." },
        { status: 400 }
      );
    }

    const serialized = JSON.stringify(draftConfig);

    if (serialized.length > 250000) {
      return NextResponse.json(
        { success: false, message: "Settings payload is too large." },
        { status: 413 }
      );
    }

    const result = await query<{
      draft_config: Record<string, unknown>;
      draft_updated_at: Date;
    }>(
      `
        INSERT INTO public.site_config (
          id,
          draft_config,
          draft_updated_at
        )
        VALUES (
          1,
          $1::jsonb,
          NOW()
        )
        ON CONFLICT (id)
        DO UPDATE SET
          draft_config =
            COALESCE(public.site_config.draft_config, '{}'::jsonb)
            || EXCLUDED.draft_config,
          draft_updated_at = NOW()
        RETURNING draft_config, draft_updated_at
      `,
      [serialized]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Admin settings draft saved successfully.",
        draftConfig: result.rows[0].draft_config,
        draftUpdatedAt: result.rows[0].draft_updated_at,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Admin settings PUT error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to save admin settings." },
      { status: 500 }
    );
  }
}