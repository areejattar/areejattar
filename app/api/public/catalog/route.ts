import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PublishedProductRow = {
  slug: string;
  published_data: Record<string, unknown>;
};

type PublishedConfigRow = {
  published_config: Record<string, unknown> | null;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}


function canonicalizeLegacyPrices(product: Record<string, unknown>) {
  const attar = isObject(product.attar) ? product.attar : {};
  const perfume = isObject(product.perfume) ? product.perfume : {};
  const attarVariants = isObject(attar.variants) ? attar.variants : {};
  const perfumeVariants = isObject(perfume.variants) ? perfume.variants : {};
  const prices = isObject(product.prices) ? { ...product.prices } : {};

  const mappings: Array<[Record<string, unknown>, string, string]> = [
    [attarVariants, "6ML", "6 ML"],
    [attarVariants, "12ML", "12 ML"],
    [perfumeVariants, "20ML", "20 ML"],
    [perfumeVariants, "30ML", "30 ML"],
    [perfumeVariants, "50ML", "50 ML"],
  ];

  for (const [variants, variantKey, legacyKey] of mappings) {
    const variant = isObject(variants[variantKey]) ? variants[variantKey] as Record<string, unknown> : null;
    if (variant && (typeof variant.price === "number" || variant.price === null)) {
      prices[legacyKey] = variant.price;
    }
  }

  const attarPrices = [attarVariants["6ML"], attarVariants["12ML"]]
    .filter(isObject)
    .map((variant) => variant.price)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  return {
    ...product,
    prices,
    // Retain the legacy summary field for older components, but derive it
    // from the canonical Attar variants instead of an independent value.
    price: attarPrices.length ? Math.min(...attarPrices) : product.price,
  };
}

export async function GET() {
  try {
    const [productResult, configResult] = await Promise.all([
      query<PublishedProductRow>(`
        SELECT slug, published_data
        FROM public.products
        WHERE published_data IS NOT NULL
          AND jsonb_typeof(published_data) = 'object'
        ORDER BY slug ASC
      `),
      query<PublishedConfigRow>(`
        SELECT published_config
        FROM public.site_config
        WHERE id = 1
        LIMIT 1
      `),
    ]);

    const products = productResult.rows
      .filter((row) => isObject(row.published_data))
      .map((row) => ({
        ...canonicalizeLegacyPrices(row.published_data),
        // The database primary key is authoritative if a JSON payload is missing its slug.
        slug: row.slug,
      }));

    const config = isObject(configResult.rows[0]?.published_config)
      ? configResult.rows[0].published_config
      : {};

    return NextResponse.json(
      {
        success: true,
        products,
        config,
        publishedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Public catalogue GET error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load the published catalogue." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
