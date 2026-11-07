
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: Retrieve all products
export async function GET() {
  try {
    if (!isAdminAuthenticated()) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const result = await query<{
      slug: string;
      draft_data: Record<string, unknown>;
      published_data: Record<string, unknown> | null;
      updated_at: Date;
      published_at: Date | null;
    }>(`
      SELECT
        slug,
        draft_data,
        published_data,
        updated_at,
        published_at
      FROM public.products
      ORDER BY slug ASC
    `);

    return NextResponse.json(
      {
        success: true,
        count: result.rowCount,
        products: result.rows,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Admin products GET error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve products." },
      { status: 500 }
    );
  }
}

// PUT: Save product changes as a draft
export async function PUT(req: Request) {
  try {
    if (!isAdminAuthenticated()) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null) as {
      slug?: unknown;
      draftData?: unknown;
    } | null;

    if (
      !body ||
      typeof body.slug !== "string" ||
      !body.slug.trim() ||
      !body.draftData ||
      typeof body.draftData !== "object" ||
      Array.isArray(body.draftData)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid product slug and draftData object are required.",
        },
        { status: 400 }
      );
    }

    const result = await query<{
      slug: string;
      updated_at: Date;
    }>(
      `
        UPDATE public.products
        SET
          draft_data = $2::jsonb,
          updated_at = NOW()
        WHERE slug = $1
        RETURNING slug, updated_at
      `,
      [body.slug.trim(), JSON.stringify(body.draftData)]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Product draft saved successfully.",
        product: result.rows[0],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Admin products PUT error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to save product draft." },
      { status: 500 }
    );
  }
}

// POST: Create a new product as an unpublished draft.
export async function POST(req: Request) {
  try {
    if (!isAdminAuthenticated()) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as {
      slug?: unknown;
      draftData?: unknown;
    } | null;

    if (
      !body || typeof body.slug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug) ||
      !body.draftData || typeof body.draftData !== "object" || Array.isArray(body.draftData)
    ) {
      return NextResponse.json({ success: false, message: "A valid slug and product draft are required." }, { status: 400 });
    }

    const serialized = JSON.stringify({ ...(body.draftData as Record<string, unknown>), slug: body.slug });
    if (serialized.length > 2_000_000) {
      return NextResponse.json({ success: false, message: "Product data is too large. Please use an image URL or a smaller image." }, { status: 413 });
    }

    const result = await query<{ slug: string; updated_at: Date }>(
      `INSERT INTO public.products (slug, draft_data, published_data, updated_at)
       VALUES ($1, $2::jsonb, NULL, NOW())
       ON CONFLICT (slug) DO NOTHING
       RETURNING slug, updated_at`,
      [body.slug, serialized]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, message: "A product with this slug already exists." }, { status: 409 });
    }

    return NextResponse.json({ success: true, message: "Product created as a draft. Publish Changes to make it live.", product: result.rows[0] }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin products POST error:", error);
    return NextResponse.json({ success: false, message: "Unable to create product." }, { status: 500 });
  }
}

// DELETE: Permanently delete selected products. This is intentionally immediate,
// unlike normal product edits which remain drafts until Publish Changes.
export async function DELETE(req: Request) {
  try {
    if (!isAdminAuthenticated()) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as { slugs?: unknown } | null;
    if (!body || !Array.isArray(body.slugs) || body.slugs.length === 0 || body.slugs.length > 100) {
      return NextResponse.json({ success: false, message: "Provide between 1 and 100 product slugs." }, { status: 400 });
    }

    const slugs = Array.from(new Set(body.slugs.filter((slug): slug is string => typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))));
    if (slugs.length !== body.slugs.length) {
      return NextResponse.json({ success: false, message: "One or more product slugs are invalid." }, { status: 400 });
    }

    const result = await query<{ slug: string }>(
      `DELETE FROM public.products WHERE slug = ANY($1::text[]) RETURNING slug`,
      [slugs]
    );

    return NextResponse.json({ success: true, deletedCount: result.rowCount, deletedSlugs: result.rows.map((row) => row.slug) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin products DELETE error:", error);
    return NextResponse.json({ success: false, message: "Unable to delete selected products." }, { status: 500 });
  }
}
