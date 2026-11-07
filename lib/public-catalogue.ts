import type { Collection, Product } from "@/data/products";

export type DiscoveryConfig = {
  enabled: boolean;
  options: number[];
  sizes: string[];
};

export type PublicCatalogConfig = {
  storeAvailability?: {
    attarEnabled?: boolean;
    perfumeEnabled?: boolean;
  };
  discovery?: Partial<Record<Collection, DiscoveryConfig>>;
  merchandising?: {
    finder?: string[];
    featured?: string[];
    best?: string[];
    finderAttar?: string[];
    finderPerfume?: string[];
    featuredAttar?: string[];
    featuredPerfume?: string[];
    bestAttar?: string[];
    bestPerfume?: string[];
  };
};

type Variant = { sku?: string; price?: number | null };
type FormatData = {
  enabled?: boolean;
  variants?: Record<string, Variant>;
};
export type PublicCatalogProduct = {
  name: string;
  slug: string;
  image: string;
  notes?: string[];
  status?: "published" | "draft";
  baseSku?: string;
  category?: string;
  description?: string;
  featured?: boolean;
  bestSeller?: boolean;
  attar?: FormatData;
  perfume?: FormatData;
};

export type PublicCatalogResponse = {
  success: boolean;
  products: PublicCatalogProduct[];
  config: PublicCatalogConfig;
  publishedAt?: string | null;
  message?: string;
};

export const defaultDiscovery: Record<Collection, DiscoveryConfig> = {
  attar: { enabled: true, options: [3, 5], sizes: ["3 ML", "6 ML"] },
  perfume: { enabled: true, options: [3, 5], sizes: ["5 ML", "10 ML"] },
};

function variant(format: FormatData | undefined, key: string): Variant | undefined {
  return format?.variants?.[key];
}

function numberPrice(v: Variant | undefined): number | null {
  return typeof v?.price === "number" && Number.isFinite(v.price) ? v.price : null;
}

/** Convert the public API's nested format structure into the legacy Product model. */
export function toStoreProduct(
  source: PublicCatalogProduct,
  collection: Collection
): Product | null {
  const format = collection === "attar" ? source.attar : source.perfume;
  if (!format?.enabled || source.status !== "published") return null;

  // Only expose the currently supported sizes for each format.
  const keys =
    collection === "attar"
      ? ["6ML", "12ML"]
      : ["30ML", "50ML", "100ML"];

  const prices: Record<string, number | null> = {};
  const variantSkus: Record<string, string> = {};
  const sizeOptions: string[] = [];
  for (const key of keys) {
    const v = variant(format, key);
    const size = `${key.slice(0, -2)} ML`;
    const price = numberPrice(v);
    if (v && price !== null) {
      prices[size] = price;
      if (typeof v.sku === "string" && v.sku.trim()) {
        variantSkus[size] = v.sku.trim();
      }
      sizeOptions.push(size);
    }
  }
  if (!sizeOptions.length) return null;

  const firstKey = keys.find((key) => numberPrice(variant(format, key)) !== null)!;
  const firstVariant = variant(format, firstKey)!;
  const baseSku = source.baseSku || firstVariant.sku || "";
  const fallbackSku = baseSku || source.slug.toUpperCase();

  return {
    slug: source.slug,
    sku: firstVariant.sku || fallbackSku,
    sku6: variant(source.attar, "6ML")?.sku || `${fallbackSku}-06M`,
    sku12: variant(source.attar, "12ML")?.sku || `${fallbackSku}-12M`,
    name: source.name,
    category: source.category || "Fragrance",
    faq: source.description || (source.notes || []).join(", "),
    collection,
    notes: Array.isArray(source.notes) ? source.notes : [],
    sizeOptions,
    prices,
    variantSkus,
    price: prices[sizeOptions[0]] ?? null,
    status: "published",
    image: source.image,
    featured: Boolean(source.featured),
    bestSeller: Boolean(source.bestSeller),
  };
}

export function mapPublicProducts(
  response: PublicCatalogResponse,
  collection?: Collection
): Product[] {
  const store = response.config?.storeAvailability || {};
  const output: Product[] = [];

  for (const source of response.products || []) {
    if (source.status !== "published") continue;
    const formats: Collection[] = collection ? [collection] : ["attar", "perfume"];
    for (const format of formats) {
      const globalEnabled =
        format === "attar"
          ? store.attarEnabled !== false
          : store.perfumeEnabled !== false;
      if (!globalEnabled) continue;
      const mapped = toStoreProduct(source, format);
      if (mapped) output.push(mapped);
    }
  }
  return output;
}

export function getDiscoveryConfig(
  config: PublicCatalogConfig | undefined,
  collection: Collection
): DiscoveryConfig {
  const saved = config?.discovery?.[collection];
  return {
    ...defaultDiscovery[collection],
    ...(saved || {}),
    options: Array.isArray(saved?.options) ? saved.options : defaultDiscovery[collection].options,
    sizes: Array.isArray(saved?.sizes) ? saved.sizes : defaultDiscovery[collection].sizes,
  };
}

export function discoveryUnitPrice(
  product: Product,
  trialSize: string
): number | null {
  const trialMl = Number.parseFloat(trialSize);
  if (!Number.isFinite(trialMl) || trialMl <= 0) return null;

  const basis =
    product.collection === "attar"
      ? (product.prices["6 ML"] != null
          ? { ml: 6, price: product.prices["6 ML"] }
          : product.prices["12 ML"] != null
            ? { ml: 12, price: product.prices["12 ML"] }
            : null)
      : (product.prices["30 ML"] != null
          ? { ml: 30, price: product.prices["30 ML"] }
          : product.prices["50 ML"] != null
            ? { ml: 50, price: product.prices["50 ML"] }
            : null);

  if (!basis || basis.price == null) return null;
  return Math.ceil((basis.price / basis.ml) * trialMl);
}

export async function fetchPublicCatalog(): Promise<PublicCatalogResponse> {
  const response = await fetch("/api/public/catalog", { cache: "no-store" });
  const data = (await response.json()) as PublicCatalogResponse;
  if (!response.ok || !data?.success || !Array.isArray(data.products)) {
    throw new Error(data?.message || "Unable to load the published fragrance catalogue.");
  }
  return data;
}
