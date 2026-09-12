"use client";
import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/data/products";

export default function AddToEnquiry({ product }: { product: Product }) {
  const [size, setSize] = useState(product.sizeOptions[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const price = (product.prices || {})[size] ?? product.price;

  function add() {
    const key = "areej-enquiry";
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    const id = product.slug + "-" + size;
    const found = items.find((x: any) => x.id === id);
    if (found) found.qty += qty;
    else items.push({ id, slug: product.slug, name: product.name, size, qty, image: product.image, price });
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new Event("areej-cart"));
    setAdded(true);
  }

  return <div className="enquiry-box">
    <label>Size & price</label>
    <div className="size-row">{product.sizeOptions.map(s => <button key={s} className={size === s ? "selected" : ""} onClick={() => setSize(s)}>{s}<small>{(product.prices || {})[s] != null ? ` · ₹${(product.prices || {})[s]!.toLocaleString("en-IN")}` : ""}</small></button>)}</div>
    <div className="qty-row"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => setQty(qty + 1)}>+</button></div>
    <button className="gold-button full-width" onClick={add}>Add to Order</button>
    {added && <div className="added-panel"><strong>Added to your order · {qty}</strong><Link href="/order-enquiry">View order & place order →</Link></div>}
    <p>Choose your size and quantity. Your order total, delivery charge and minimum-order status are calculated on the order page.</p>
  </div>;
}
