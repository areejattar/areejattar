"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { products } from "@/data/products";
import OrderActions from "@/components/OrderActions";

type Settings = { minOrderEnabled: boolean; minOrderValue: number; freeDeliveryThreshold: number; deliveryCharge: number; trial3mlEnabled: boolean; trial3mlPrice: number | null };
const defaultSettings: Settings = { minOrderEnabled: true, minOrderValue: 599, freeDeliveryThreshold: 1000, deliveryCharge: 75, trial3mlEnabled: true, trial3mlPrice: null };

export default function OrderEnquiry() {
  const [items, setItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [address, setAddress] = useState("");
  useEffect(() => { setItems(JSON.parse(localStorage.getItem("areej-enquiry") || "[]")); setSettings({ ...defaultSettings, ...(JSON.parse(localStorage.getItem("areej-order-settings") || "{}")) }); }, []);
  function persist(a: any[]) { setItems(a); localStorage.setItem("areej-enquiry", JSON.stringify(a)); window.dispatchEvent(new Event("areej-cart")); }
  function update(i: number, d: number) { const a = [...items]; a[i].qty = Math.max(1, a[i].qty + d); persist(a); }
  function remove(i: number) { persist(items.filter((_, x) => x !== i)); }
  const subtotal = useMemo(() => items.reduce((n, x) => n + Number(x.price || 0) * Number(x.qty || 0), 0), [items]);
  const hasMainItems = items.some(x => !x.discoverySet && !x.trialMode);
  const hasTrialItems = items.some(x => Boolean(x.discoverySet || x.trialMode));
  const delivery = subtotal === 0 || subtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryCharge;
  const minRemaining = settings.minOrderEnabled && hasMainItems ? Math.max(0, settings.minOrderValue - subtotal) : 0;
  const suggestions = products.filter(p => p.status === "published" && !items.some(i => i.slug === p.slug)).map(p => ({ p, min: Math.min(...Object.values(p.prices || {}).filter((x:any) => typeof x === "number")) })).sort((a,b) => Math.abs(a.min - minRemaining) - Math.abs(b.min - minRemaining)).slice(0, 4).map(x => x.p);
  const lines = items.map(x => `${x.name} | ${x.size} | Qty ${x.qty} | ₹${Number(x.price || 0).toLocaleString("en-IN")}`).join("\n");
  const message = `Hello AREEJ,\n\nI would like to place an order:\n${lines}\n\nSubtotal: ₹${subtotal.toLocaleString("en-IN")}\nDelivery: ${delivery ? `₹${delivery}` : "Free"}\nTotal: ₹${(subtotal + delivery).toLocaleString("en-IN")}\n\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\n\nPlease confirm availability and dispatch details.`;
  const valid = items.length > 0 && (!settings.minOrderEnabled || !hasMainItems || subtotal >= settings.minOrderValue);

  return <main className="inner-page order-page"><p className="eyebrow">Your order</p><h1>Place order</h1>
    {items.length === 0 ? <><p>Your order is empty. Browse the catalogue and add fragrances to begin.</p><Link href="/perfume" className="gold-button">Browse fragrances</Link></> : <>
      <div className="enquiry-list">{items.map((x, i) => <div className="enquiry-line" key={x.id}><div><strong>{x.name}</strong><small>{x.size} · ₹{Number(x.price || 0).toLocaleString("en-IN")} each</small></div><span><button onClick={() => update(i, -1)}>−</button>{x.qty}<button onClick={() => update(i, 1)}>+</button><button onClick={() => remove(i)}>Remove</button></span></div>)}</div>
      {settings.trial3mlEnabled && <section className="cart-trial"><div><p className="eyebrow">Try before committing</p><h3>Prefer a 3 ML trial?</h3><p>Add a smaller trial where available. Trial pricing is controlled from Admin.</p></div><div className="trial-grid">{products.filter(p => p.status === "published").slice(0, 4).map(p => <button key={p.slug} onClick={() => { const price = settings.trial3mlPrice; const a = [...items, { id: p.slug + "-3 ML", slug: p.slug, name: p.name, size: "3 ML Trial", qty: 1, image: p.image, price }]; persist(a); }}>{p.name.replace(/^Areej /,"")} <small>{settings.trial3mlPrice != null ? `₹${settings.trial3mlPrice}` : "Price in admin"}</small></button>)}</div></section>}
      {hasTrialItems && !hasMainItems && <div className="trial-only-note">✦ No minimum order value on trials. Add a regular product whenever you are ready for a full-size order.</div>}
      {settings.minOrderEnabled && hasMainItems && minRemaining > 0 && <section className="cart-nudge"><strong>Add ₹{minRemaining.toLocaleString("en-IN")} more to reach the ₹{settings.minOrderValue.toLocaleString("en-IN")} minimum order.</strong><p>We selected a few fragrances below to help you complete your order.</p><div className="nudge-grid">{suggestions.map(p => <Link key={p.slug} href={`/product/${p.slug}`}><strong>{p.name.replace(/^Areej /,"")}</strong><small>From ₹{Math.min(...Object.values(p.prices || {}).filter((x: any) => typeof x === "number"))}</small></Link>)}</div></section>}
      <div className="order-summary"><div><span>Subtotal</span><strong>₹{subtotal.toLocaleString("en-IN")}</strong></div><div><span>Delivery</span><strong>{delivery ? `₹${delivery}` : "Free"}</strong></div><div className="summary-total"><span>Total</span><strong>₹{(subtotal + delivery).toLocaleString("en-IN")}</strong></div><p>Pan-India delivery: ₹{settings.deliveryCharge} below ₹{settings.freeDeliveryThreshold.toLocaleString("en-IN")}; free at or above ₹{settings.freeDeliveryThreshold.toLocaleString("en-IN")}.</p></div>
      <div className="customer-form"><input placeholder="Your name" value={name} onChange={e => setName(e.target.value)}/><input placeholder="Mobile number" value={phone} onChange={e => setPhone(e.target.value)}/><textarea placeholder="Delivery address" value={address} onChange={e => setAddress(e.target.value)}/></div>
      {!valid && settings.minOrderEnabled && hasMainItems && <p className="validation-note">Your order must reach ₹{settings.minOrderValue.toLocaleString("en-IN")} before placing it.</p>}
      {valid ? <OrderActions message={message}/> : <div className="disabled-actions"><button className="gold-button" disabled>Place Order via WhatsApp</button><button className="outline-button" disabled>Place Order via Email</button><button className="outline-button" disabled>Place Order via Insta</button></div>}
    </>}
  </main>
}
