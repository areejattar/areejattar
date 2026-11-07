"use client";

import { useEffect, useMemo, useState } from "react";
import type { Collection, Product } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import { fetchPublicCatalog, mapPublicProducts, type PublicCatalogConfig } from "@/lib/public-catalogue";

export default function Finder() {
  const [mood, setMood] = useState<"all" | Collection>("all");
  const [search, setSearch] = useState("");
  const [all, setAll] = useState<Product[]>([]);
  const [config, setConfig] = useState<PublicCatalogConfig>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchPublicCatalog()
      .then((data) => {
        if (cancelled) return;
        setAll(mapPublicProducts(data));
        setConfig(data.config || {});
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load fragrance recommendations.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const result = useMemo(() => {
    const pool = all
      .filter((p) => p.status === "published")
      .filter((p) => mood === "all" || p.collection === mood);

    const m = config.merchandising || {};
    const attarIds: string[] = Array.isArray(m.finderAttar)
      ? m.finderAttar
      : (m.finder || []);
    const perfumeIds: string[] = Array.isArray(m.finderPerfume)
      ? m.finderPerfume
      : [];

    // Resolve each selection against its own format. A shared slug can exist
    // twice in the catalogue (Attar + Perfume), so slug-only lookup is unsafe.
    const selectedProducts =
      mood === "attar"
        ? attarIds.map((id) => pool.find((p) => p.slug === id && p.collection === "attar"))
        : mood === "perfume"
          ? perfumeIds.map((id) => pool.find((p) => p.slug === id && p.collection === "perfume"))
          : [
              ...attarIds.map((id) => pool.find((p) => p.slug === id && p.collection === "attar")),
              ...perfumeIds.map((id) => pool.find((p) => p.slug === id && p.collection === "perfume")),
            ];

    // The published Admin selection is authoritative. Do not append other
    // catalogue products to fill the result slots.
    const term = search.trim().toLocaleLowerCase();

    return selectedProducts
      .filter((p): p is Product => Boolean(p))
      .filter((p) => {
        if (!term) return true;
        // Search the product name and the editable fragrance description.
        // Notes/category are included as useful searchable catalogue text too.
        const searchableText = [
          p.name,
          p.faq,
          p.category,
          ...(Array.isArray(p.notes) ? p.notes : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase();

        // Substring matching intentionally supports short queries such as "sh".
        return searchableText.includes(term);
      });
  }, [mood, search, all, config]);

  return (
    <main className="finder-page">
      <section className="finder-intro finder-hero">
        <div className="finder-hero-art" aria-hidden="true" />
        <div className="finder-hero-copy">
          <p className="eyebrow">A guided beginning</p>
          <h1>Find your fragrance.</h1>
          <p>Start with a direction, not a product name. We'll use the published AREEJ catalogue to give you a small set to explore.</p>
        </div>
      </section>
      <section className="finder-controls">
        <div>
          <label>What world interests you?</label>
          <div className="choice-row">
            <button className={mood === "all" ? "selected" : ""} onClick={() => setMood("all")}>Show me everything</button>
            <button className={mood === "attar" ? "selected" : ""} onClick={() => setMood("attar")}>Attar</button>
            <button className={mood === "perfume" ? "selected" : ""} onClick={() => setMood("perfume")}>Perfume</button>
          </div>
        </div>
        <div className="finder-search-field">
          <label htmlFor="fragrance-search">Search fragrances</label>
          <div className="finder-search-row">
            <input
              id="fragrance-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name or description..."
              autoComplete="off"
            />
            {!loading && !error ? (
              <span className="finder-result-count" aria-live="polite">
                {result.length} {result.length === 1 ? "fragrance" : "fragrances"} found
              </span>
            ) : null}
          </div>
        </div>
      </section>
      <div className="section-heading">
        <div><p className="eyebrow">Your starting point</p><h2>Explore these first.</h2></div>
      </div>
      {loading ? <p className="catalogue-status">Finding fragrances from the published catalogue...</p> : null}
      {error ? <p className="catalogue-status" role="alert">{error}</p> : null}
      {!loading && !error ? (
        result.length ? (
          <>
            <div className="product-grid">
              {result.map((p) => <ProductCard key={`${p.slug}-${p.collection}`} product={p} />)}
            </div>
          </>
        ) : (
          <p className="catalogue-status">
            {search.trim()
              ? `No selected fragrances match “${search.trim()}”. Try another search.`
              : "No fragrances have been selected for this category yet. Choose products in Admin → Find Your Fragrance, save the changes, and publish them."}
          </p>
        )
      ) : null}
    </main>
  );
}
