"use client";
import { useEffect, useMemo, useState } from "react";
import { products, type Product } from "@/data/products";
import ProductCard from "@/components/ProductCard";

export default function Finder() {
  const [mood, setMood] = useState("all");
  const [pref, setPref] = useState("all");
  const [all, setAll] = useState(products);
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("areej-admin-products") || "null");
    if (saved) setAll(saved);
  }, []);
  const options = Array.from(new Set(all.flatMap(p => p.notes))).slice(0, 18);
  const result = useMemo(() => {
    const selectedIds: string[] = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("areej-finder") || "[]") : [];
    const pool: Product[] = all.filter(p => p.status === "published").filter(p => pref === "all" || p.notes.includes(pref)).filter(p => mood === "all" || p.collection === mood);
    const curated: Product[] = selectedIds.length ? selectedIds.map((id: string) => pool.find(p => p.slug === id)).filter((p): p is Product => Boolean(p)) : pool;
    return curated.slice(0, 4);
  }, [mood, pref, all]);

  return (
    <main className="finder-page">
      <section className="finder-intro finder-hero">
        <div className="finder-hero-art" aria-hidden="true" />
        <div className="finder-hero-copy">
          <p className="eyebrow">A guided beginning</p>
          <h1>Find your fragrance.</h1>
          <p>Start with a direction, not a product name. We'll use the AREEJ catalogue to give you a small set to explore.</p>
        </div>
      </section>
      <section className="finder-controls">
        <div><label>What world interests you?</label><div className="choice-row"><button className={mood === "all" ? "selected" : ""} onClick={() => setMood("all")}>Show me everything</button><button className={mood === "attar" ? "selected" : ""} onClick={() => setMood("attar")}>Attar</button><button className={mood === "perfume" ? "selected" : ""} onClick={() => setMood("perfume")}>Perfume</button></div></div>
        <div><label>Choose a note</label><select value={pref} onChange={e => setPref(e.target.value)}><option value="all">Surprise me</option>{options.map(o => <option key={o}>{o}</option>)}</select></div>
      </section>
      <div className="section-heading"><div><p className="eyebrow">Your starting point</p><h2>Explore these first.</h2></div></div>
      <div className="product-grid">{result.map(p => <ProductCard key={p.slug} product={p} />)}</div>
    </main>
  );
}
