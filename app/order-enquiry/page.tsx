"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/data/products";
import OrderActions from "@/components/OrderActions";

type Settings = { minOrderEnabled: boolean; minOrderValue: number; freeDeliveryThreshold: number; deliveryCharge: number };
const defaultSettings: Settings = { minOrderEnabled: true, minOrderValue: 599, freeDeliveryThreshold: 1000, deliveryCharge: 75 };

type PublishedProduct = {
  slug: string;
  name?: string;
  status?: string;
  prices?: Record<string, number | null>;
  price?: number | null;
  attar?: { enabled?: boolean; variants?: Record<string, { price?: number | null }> };
  perfume?: { enabled?: boolean; variants?: Record<string, { price?: number | null }> };
};

function getPublishedMinPrice(p: PublishedProduct): number | null {
  const values = [
    ...Object.values(p.prices || {}),
    ...Object.values(p.attar?.variants || {}).map((v) => v?.price),
    ...Object.values(p.perfume?.variants || {}).map((v) => v?.price),
    p.price,
  ].filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0);
  return values.length ? Math.min(...values) : null;
}

export default function OrderEnquiry() {
  const [items, setItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [catalogue, setCatalogue] = useState<PublishedProduct[]>([]);
  const [catalogueError, setCatalogueError] = useState("");
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [address, setAddress] = useState("");
  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem("areej-enquiry") || "[]"));
    setSettings({ ...defaultSettings, ...(JSON.parse(localStorage.getItem("areej-order-settings") || "{}")) });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadPublishedCatalogue() {
      try {
        const response = await fetch("/api/public/catalog", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data?.success || !Array.isArray(data.products)) {
          throw new Error(data?.message || "Unable to load published catalogue.");
        }
        if (!cancelled) {
          setCatalogue(data.products.filter((p: PublishedProduct) => p.status === "published"));
          setCatalogueError("");
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogue([]);
          setCatalogueError(error instanceof Error ? error.message : "Unable to load published catalogue.");
        }
      }
    }
    loadPublishedCatalogue();
    return () => { cancelled = true; };
  }, []);
  function persist(a: any[]) { setItems(a); localStorage.setItem("areej-enquiry", JSON.stringify(a)); window.dispatchEvent(new Event("areej-cart")); }
  function update(i: number, d: number) { const a = [...items]; a[i].qty = Math.max(1, a[i].qty + d); persist(a); }
  function remove(i: number) { persist(items.filter((_, x) => x !== i)); }
  function clearCart() {
    if (window.confirm("Are you sure you want to clear your entire cart?")) persist([]);
  }
  const subtotal = useMemo(() => items.reduce((n, x) => n + Number(x.price || 0) * Number(x.qty || 0), 0), [items]);
  const hasMainItems = items.some(x => !x.discoverySet && !x.trialMode);
  const hasTrialItems = items.some(x => Boolean(x.discoverySet || x.trialMode));
  const delivery = subtotal === 0 || subtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryCharge;
  const minRemaining = settings.minOrderEnabled && hasMainItems ? Math.max(0, settings.minOrderValue - subtotal) : 0;
  const suggestions = catalogue
    .filter((p) => !items.some((i) => i.slug === p.slug))
    .map((p) => ({ product: p, min: getPublishedMinPrice(p) }))
    .filter((entry): entry is { product: PublishedProduct; min: number } => entry.min !== null)
    .sort((a, b) => Math.abs(a.min - minRemaining) - Math.abs(b.min - minRemaining))
    .slice(0, 4);
  const lines = items.map(x => `${x.name} | ${x.size} | Qty ${x.qty} | ₹${Number(x.price || 0).toLocaleString("en-IN")}`).join("\n");
  const message = `Hello AREEJ,\n\nI would like to place an order:\n${lines}\n\nSubtotal: ₹${subtotal.toLocaleString("en-IN")}\nDelivery: ${delivery ? `₹${delivery}` : "Free"}\nTotal: ₹${(subtotal + delivery).toLocaleString("en-IN")}\n\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\n\nPlease confirm availability and dispatch details.`;
  const valid = items.length > 0 && (!settings.minOrderEnabled || !hasMainItems || subtotal >= settings.minOrderValue);

  return <main className="inner-page order-page"><p className="eyebrow">Your order</p><h1>Place order</h1>
    {items.length === 0 ? <><p>Your order is empty. Browse the catalogue and add fragrances to begin.</p><Link href="/perfume" className="gold-button">Browse fragrances</Link></> : <>
      <div className="cart-heading"><h2>Your items</h2><button type="button" className="outline-button clear-cart-button" onClick={clearCart}>Clear Cart</button></div>
      <div className="enquiry-list">{items.map((x, i) => <div className="enquiry-line" key={x.id}><div><strong>{x.name}</strong><small>{x.size} · ₹{Number(x.price || 0).toLocaleString("en-IN")} each</small></div><span><button onClick={() => update(i, -1)}>−</button>{x.qty}<button onClick={() => update(i, 1)}>+</button><button onClick={() => remove(i)}>Remove</button></span></div>)}</div>
      {hasTrialItems && !hasMainItems && <div className="trial-only-note">✦ No minimum order value on trials. Add a regular product whenever you are ready for a full-size order.</div>}
      {settings.minOrderEnabled && hasMainItems && minRemaining > 0 && <section className="cart-nudge"><strong>Add ₹{minRemaining.toLocaleString("en-IN")} more to reach the ₹{settings.minOrderValue.toLocaleString("en-IN")} minimum order.</strong><p>We selected a few fragrances below to help you complete your order.</p><div className="nudge-grid">{catalogueError ? <p role="alert">{catalogueError}</p> : suggestions.map(({ product }) => {
            const price = getPublishedMinPrice(product);
            return price === null ? null : <Link key={product.slug} href={`/product/${product.slug}`}><strong>{(product.name || product.slug).replace(/^Areej /,"")}</strong><small>From ₹{price.toLocaleString("en-IN")}</small></Link>;
          })}</div></section>}
      <div className="order-summary"><div><span>Subtotal</span><strong>₹{subtotal.toLocaleString("en-IN")}</strong></div><div><span>Delivery</span><strong>{delivery ? `₹${delivery}` : "Free"}</strong></div><div className="summary-total"><span>Total</span><strong>₹{(subtotal + delivery).toLocaleString("en-IN")}</strong></div><p>Pan-India delivery: ₹{settings.deliveryCharge} below ₹{settings.freeDeliveryThreshold.toLocaleString("en-IN")}; free at or above ₹{settings.freeDeliveryThreshold.toLocaleString("en-IN")}.</p></div>
      <div className="customer-form"><input placeholder="Your name" value={name} onChange={e => setName(e.target.value)}/><input placeholder="Mobile number" value={phone} onChange={e => setPhone(e.target.value)}/><textarea placeholder="Delivery address" value={address} onChange={e => setAddress(e.target.value)}/></div>
      {!valid && settings.minOrderEnabled && hasMainItems && <p className="validation-note">Your order must reach ₹{settings.minOrderValue.toLocaleString("en-IN")} before placing it.</p>}
      {valid ? <OrderActions message={message}/> : <div className="disabled-actions"><button className="gold-button" disabled>Place Order via WhatsApp</button><button className="outline-button" disabled>Place Order via Email</button><button className="outline-button" disabled>Place Order via Insta</button></div>}
    </>}
  </main>
}
