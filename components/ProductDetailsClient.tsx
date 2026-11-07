"use client";

import { useEffect, useMemo, useState } from "react";
import type { Collection, Product } from "@/data/products";
import AddToEnquiry from "@/components/AddToEnquiry";
import { fetchPublicCatalog, mapPublicProducts } from "@/lib/public-catalogue";

export default function ProductDetailsClient({
  slug,
  initialFormat,
}: {
  slug: string;
  initialFormat?: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [active, setActive] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchPublicCatalog()
      .then((data) => {
        if (cancelled) return;
        const mapped = mapPublicProducts(data).filter((p) => p.slug === slug);
        setProducts(mapped);

        const requestedFormat =
          initialFormat === "perfume" || initialFormat === "attar"
            ? initialFormat
            : null;
        const requestedProduct = requestedFormat
          ? mapped.find((p) => p.collection === requestedFormat)
          : null;

        // Respect the collection the customer came from; otherwise prefer Attar.
        setActive(
          requestedProduct?.collection ||
          mapped.find((p) => p.collection === "attar")?.collection ||
          mapped[0]?.collection ||
          null
        );
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load this fragrance.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug, initialFormat]);

  const product = useMemo(
    () => products.find((p) => p.collection === active) || null,
    [products, active]
  );

  if (loading) return <main className="product-page"><p className="catalogue-status">Loading published fragrance...</p></main>;
  if (error) return <main className="product-page"><p className="catalogue-status" role="alert">{error}</p></main>;
  if (!product) return <main className="product-page"><p className="catalogue-status">This fragrance is not currently available.</p></main>;

  const entries = Object.entries(product.prices).filter(
    (entry): entry is [string, number] => typeof entry[1] === "number"
  );

  return (
    <main className="product-page">
      <div className="product-detail">
        <div className="detail-image">
          <img
            src={product.image}
            alt={product.name}
            loading="eager"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{product.collection} · {product.sku}</p>
          <h1>{product.name.replace(/^Areej /, "")}</h1>
          <p className="detail-lead">{product.faq}</p>

          {products.length > 1 ? (
            <div className="format-switcher" aria-label="Choose fragrance format">
              {products.map((option) => (
                <button
                  key={option.collection}
                  type="button"
                  className={active === option.collection ? "selected" : ""}
                  aria-pressed={active === option.collection}
                  onClick={() => setActive(option.collection)}
                >
                  {option.collection === "attar" ? "Pure Attar" : "Modern Perfume"}
                </button>
              ))}
            </div>
          ) : null}

          <div className="price-table">
            <p className="eyebrow">Current rate card</p>
            {entries.map(([size, price]) => (
              <div key={size}><span>{size}</span><strong>₹{price.toLocaleString("en-IN")}</strong></div>
            ))}
          </div>
          <div className="notes">
            <p className="eyebrow">Fragrance profile</p>
            <div>{product.notes.map((note) => <span key={note}>{note}</span>)}</div>
          </div>
          <AddToEnquiry key={`${product.slug}-${product.collection}`} product={product} />
        </div>
      </div>
      <section className="product-story">
        <p className="eyebrow">About this fragrance</p>
        <h2>A scent to explore at your own pace.</h2>
        <p>{product.faq}. Place your order with AREEJ through WhatsApp, email or Instagram and we will confirm availability and delivery.</p>
      </section>
    </main>
  );
}
