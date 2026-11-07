"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/data/products";
import ProductCard from "./ProductCard";

export default function CatalogueBrowser({ products }: { products: Product[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [note, setNote] = useState("all");
  const [sort, setSort] = useState("featured");

  const cats = Array.from(new Set(products.map((p) => p.category)));
  const notes = Array.from(new Set(products.flatMap((p) => p.notes))).sort();

  const filtered = useMemo(() => {
    const result = products.filter(
      (p) =>
        p.status === "published" &&
        (p.name + " " + p.sku + " " + p.category + " " + p.faq + " " + p.notes.join(" "))
          .toLowerCase()
          .includes(q.toLowerCase()) &&
        (cat === "all" || p.category === cat) &&
        (note === "all" || p.notes.includes(note))
    );

    if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "new") result.sort((a, b) => b.sku.localeCompare(a.sku));
    if (sort === "featured") {
      result.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    }
    return result;
  }, [products, q, cat, note, sort]);

  return (
    <>
      <div className="catalogue-tools">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, notes, SKU..." aria-label="Search products" />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={note} onChange={(e) => setNote(e.target.value)}>
          <option value="all">All notes</option>
          {notes.map((n) => <option key={n}>{n}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="featured">Featured</option>
          <option value="name">Name A–Z</option>
          <option value="new">SKU</option>
        </select>
      </div>
      <p className="result-count">{filtered.length} fragrances</p>
      {filtered.length ? (
        <div className="product-grid">
          {filtered.map((p) => <ProductCard key={`${p.slug}-${p.collection}`} product={p} />)}
        </div>
      ) : (
        <p className="catalogue-empty">No published fragrances match those filters.</p>
      )}
    </>
  );
}
