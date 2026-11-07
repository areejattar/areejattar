"use client";

import { useEffect, useMemo, useState } from "react";
import type { Collection, Product } from "@/data/products";
import Link from "next/link";
import {
  discoveryUnitPrice,
  fetchPublicCatalog,
  getDiscoveryConfig,
  mapPublicProducts,
  type DiscoveryConfig,
} from "@/lib/public-catalogue";

export default function DiscoveryBuilder({ collection }: { collection: Collection }) {
  const [config, setConfig] = useState<DiscoveryConfig | null>(null);
  const [catalogue, setCatalogue] = useState<Product[]>([]);
  const [setSize, setSetSize] = useState("");
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchPublicCatalog()
      .then((data) => {
        if (cancelled) return;
        const nextConfig = getDiscoveryConfig(data.config, collection);
        setConfig(nextConfig);
        setCatalogue(mapPublicProducts(data, collection));
        setCount(nextConfig.options[0] || 0);
        setSetSize(nextConfig.sizes[0] || "");
        setSelected([]);
        setAdded(false);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load discovery options.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [collection]);

  const candidates = useMemo(
    () => catalogue.filter((p) => discoveryUnitPrice(p, setSize) !== null),
    [catalogue, setSize]
  );

  const price = useMemo(
    () => selected.reduce((total, slug) => {
      const product = candidates.find((p) => p.slug === slug);
      return total + (product ? discoveryUnitPrice(product, setSize) || 0 : 0);
    }, 0),
    [selected, candidates, setSize]
  );

  function toggle(slug: string) {
    setSelected((current) => {
      if (current.includes(slug)) return current.filter((item) => item !== slug);
      if (current.length >= count) return current;
      return [...current, slug];
    });
    setAdded(false);
  }

  function add() {
    if (selected.length !== count) return;
    const key = "areej-enquiry";
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    const stamp = Date.now();

    selected.forEach((slug, index) => {
      const product = candidates.find((p) => p.slug === slug);
      if (!product) return;
      const unitPrice = discoveryUnitPrice(product, setSize);
      if (unitPrice === null) return;
      items.push({
        id: `discovery-${collection}-${count}-${setSize}-${slug}-${stamp}-${index}`,
        slug: product.slug,
        name: `${product.name} · ${collection === "attar" ? "Attar" : "Perfume"} Discovery`,
        size: setSize,
        qty: 1,
        image: product.image,
        price: unitPrice,
        discoverySet: count,
        discoveryCollection: collection,
      });
    });

    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new Event("areej-cart"));
    setAdded(true);
  }

  if (loading) return <p className="catalogue-status">Loading published discovery options...</p>;
  if (error) return <p className="catalogue-status" role="alert">{error}</p>;
  if (!config?.enabled) return <p className="catalogue-status">This discovery experience is currently unavailable.</p>;
  if (!config.options.length || !config.sizes.length) {
    return <p className="catalogue-status">Discovery options are being configured. Please check back soon.</p>;
  }

  const label = collection === "attar" ? "Attar" : "Perfume";
  const helper = collection === "attar"
    ? "Choose different attars and trial them in an available sample size."
    : "Choose different perfumes and trial them in an available sample size.";

  return (
    <section className={`discovery-builder discovery-${collection}`}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{label} discovery</p>
          <h2>Build your {label.toLowerCase()} trial set.</h2>
          <p>{helper} Trial pricing is calculated proportionally from the product's 6 ML Attar price (or 12 ML when 6 ML is unavailable), and the 30 ML Perfume price (or 50 ML when 30 ML is unavailable), rounded up to the next rupee.</p>
        </div>
      </div>

      <div className="builder-controls">
        <div>
          <label>Set</label>
          <div className="choice-row">
            {config.options.map((n) => (
              <button key={n} className={count === n ? "selected" : ""} onClick={() => { setCount(n); setSelected([]); setAdded(false); }}>
                {n} fragrances
              </button>
            ))}
          </div>
        </div>
        <div>
          <label>Trial size</label>
          <div className="choice-row">
            {config.sizes.map((size) => (
              <button key={size} className={setSize === size ? "selected" : ""} onClick={() => { setSetSize(size); setAdded(false); }}>
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="builder-count">
        <span>Selected <strong>{selected.length}/{count}</strong></span>
        {selected.length > 0 ? <span>Discovery set: <strong>₹{price.toLocaleString("en-IN")}</strong></span> : null}
      </div>

      {candidates.length ? (
        <div className="trial-product-grid">
          {candidates.map((product) => {
            const unit = discoveryUnitPrice(product, setSize);
            const chosen = selected.includes(product.slug);
            return (
              <button key={product.slug} className={chosen ? "trial-product selected" : "trial-product"} onClick={() => toggle(product.slug)} disabled={!chosen && selected.length >= count}>
                <span>{product.name.replace(/^Areej /, "")}</span>
                <small>{product.notes.slice(0, 2).join(" · ")}</small>
                <small>{unit !== null ? `Trial ${setSize}: ₹${unit}` : "Trial price unavailable"}</small>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="catalogue-status">No published products have a price basis for this trial size.</p>
      )}

      <button className="gold-button" disabled={selected.length !== count || count < 1} onClick={add}>Add discovery set to order</button>

      {added ? (
        <div className="added-panel discovery-added-panel">
          <div>
            <strong>{label} discovery set added · ₹{price.toLocaleString("en-IN")}</strong>
            <small>Your trial set is in your cart. No minimum order value applies to trials.</small>
          </div>
          <Link href="/order-enquiry" className="gold-button">View cart & place order →</Link>
        </div>
      ) : null}
    </section>
  );
}
