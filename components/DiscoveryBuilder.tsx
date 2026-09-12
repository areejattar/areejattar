"use client";
import { useEffect, useMemo, useState } from "react";
import type { Collection, Product } from "@/data/products";
import Link from "next/link";

type Config = {
  enabled: boolean;
  options: number[];
  sizes: string[];
};

const defaults: Record<Collection, Config> = {
  attar: { enabled: true, options: [3, 5], sizes: ["3 ML", "6 ML"] },
  perfume: { enabled: true, options: [3, 5], sizes: ["5 ML", "10 ML"] },
};

function loadConfig(collection: Collection): Config {
  if (typeof window === "undefined") return defaults[collection];
  try {
    const saved = JSON.parse(localStorage.getItem(`areej-discovery-${collection}`) || "null");
    return { ...defaults[collection], ...(saved || {}) };
  } catch {
    return defaults[collection];
  }
}

function discoveryUnitPrice(product: Product, size: string) {
  const ml = Number.parseFloat(size);
  const base30 = product.prices?.["30 ML"];
  if (!Number.isFinite(ml) || typeof base30 !== "number") return null;
  return Math.ceil((base30 / 30) * ml);
}

export default function DiscoveryBuilder({ products, collection }: { products: Product[]; collection: Collection }) {
  const [config, setConfig] = useState<Config>(defaults[collection]);
  const [catalogue, setCatalogue] = useState<Product[]>(products);
  const [setSize, setSetSize] = useState(defaults[collection].sizes[0]);
  const [count, setCount] = useState(3);
  const [selected, setSelected] = useState<string[]>([]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const savedProducts = JSON.parse(localStorage.getItem("areej-admin-products") || "null");
    if (savedProducts) setCatalogue(savedProducts);
    const c = loadConfig(collection);
    setConfig(c);
    setCount(c.options?.[0] || 3);
    setSetSize(c.sizes?.[0] || defaults[collection].sizes[0]);
    setSelected([]);
    setAdded(false);
  }, [collection]);

  const candidates = useMemo(
    () => catalogue.filter(p => p.collection === collection && p.status === "published" && typeof p.prices?.["30 ML"] === "number"),
    [catalogue, collection]
  );

  const price = useMemo(() => {
    return selected.reduce((total, slug) => {
      const p = candidates.find(x => x.slug === slug);
      return total + (p ? discoveryUnitPrice(p, setSize) || 0 : 0);
    }, 0);
  }, [selected, candidates, setSize]);

  function toggle(slug: string) {
    setSelected(current => {
      if (current.includes(slug)) return current.filter(x => x !== slug);
      if (current.length >= count) return current;
      return [...current, slug];
    });
    setAdded(false);
  }

  function add() {
    if (selected.length !== count) return;
    const items = JSON.parse(localStorage.getItem("areej-enquiry") || "[]");
    const stamp = Date.now();
    selected.forEach((slug, index) => {
      const p = candidates.find(x => x.slug === slug);
      if (!p) return;
      const unit = discoveryUnitPrice(p, setSize);
      if (unit == null) return;
      items.push({
        id: `discovery-${collection}-${count}-${setSize}-${slug}-${stamp}-${index}`,
        slug: p.slug,
        name: `${p.name} · ${collection === "attar" ? "Attar" : "Perfume"} Discovery`,
        size: setSize,
        qty: 1,
        image: p.image,
        price: unit,
        discoverySet: count,
        discoveryCollection: collection,
      });
    });
    localStorage.setItem("areej-enquiry", JSON.stringify(items));
    window.dispatchEvent(new Event("areej-cart"));
    setAdded(true);
  }

  if (!config.enabled) return null;

  const label = collection === "attar" ? "Attar" : "Perfume";
  const helper = collection === "attar"
    ? "Choose 3 or 5 different attars and trial them in 3 ML or 6 ML."
    : "Choose 3 or 5 different perfumes and trial them in 5 ML or 10 ML.";

  return (
    <section className={`discovery-builder discovery-${collection}`}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{label} discovery</p>
          <h2>Build your {label.toLowerCase()} trial set.</h2>
          <p>{helper} Every selected fragrance is priced from its own 30 ML catalogue price, converted to the selected trial size and rounded up to the next rupee.</p>
        </div>
      </div>
      <div className="builder-controls">
        <div>
          <label>Set</label>
          <div className="choice-row">
            {config.options.map(n => (
              <button key={n} className={count === n ? "selected" : ""} onClick={() => { setCount(n); setSelected([]); setAdded(false); }}>
                {n} fragrances
              </button>
            ))}
          </div>
        </div>
        <div>
          <label>Trial size</label>
          <div className="choice-row">
            {config.sizes.map(s => (
              <button key={s} className={setSize === s ? "selected" : ""} onClick={() => { setSetSize(s); setAdded(false); }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="builder-count">
        <span>Selected <strong>{selected.length}/{count}</strong></span>
        {selected.length > 0 && <span>Discovery set: <strong>₹{price.toLocaleString("en-IN")}</strong></span>}
      </div>
      <div className="trial-product-grid">
        {candidates.map(p => {
          const unit = discoveryUnitPrice(p, setSize);
          return (
            <button key={p.slug} className={selected.includes(p.slug) ? "trial-product selected" : "trial-product"} onClick={() => toggle(p.slug)} disabled={!selected.includes(p.slug) && selected.length >= count}>
              <span>{p.name.replace(/^Areej /, "")}</span>
              <small>{p.notes.slice(0, 2).join(" · ")}</small>
              <small>{unit != null ? `Trial ${setSize}: ₹${unit}` : "30 ML price required"}</small>
            </button>
          );
        })}
      </div>
      <button className="gold-button" disabled={selected.length !== count} onClick={add}>Add discovery set to order</button>
      {added && (
        <div className="added-panel discovery-added-panel">
          <div>
            <strong>{label} discovery set added · ₹{price.toLocaleString("en-IN")}</strong>
            <small>Your trial set is in your cart. No minimum order value applies to trials.</small>
          </div>
          <Link href="/order-enquiry" className="gold-button">View cart & place order →</Link>
        </div>
      )}
    </section>
  );
}
