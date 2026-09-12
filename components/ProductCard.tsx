"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/data/products";

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  const [added, setAdded] = useState(false);

  const prices = Object.values(product.prices ?? {}).filter(
    (value): value is number => typeof value === "number"
  );

  const minPrice = prices.length > 0 ? Math.min(...prices) : product.price;

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const key = "areej-enquiry";
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    const size = product.sizeOptions?.[0] || "6 ML";
    const price = (product.prices || {})[size] ?? minPrice;
    const id = product.slug + "-" + size;
    const found = items.find((x: any) => x.id === id);
    if (found) {
      found.qty += 1;
    } else {
      items.push({
        id,
        slug: product.slug,
        name: product.name,
        size,
        qty: 1,
        image: product.image,
        price,
      });
    }
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new Event("areej-cart"));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <article className="product-card">
      <Link href={`/product/${product.slug}`} className="product-image-wrap">
        {product.bestSeller ? (
          <span className="card-badge badge-bestseller">Best Seller</span>
        ) : product.featured ? (
          <span className="card-badge badge-signature">Signature</span>
        ) : (
          <span className="card-badge">{product.collection}</span>
        )}

        {product.image.startsWith("data:") ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        )}
      </Link>

      <div className="product-info">
        <p className="eyebrow">
          {product.collection} · {product.sku}
        </p>

        <h3>
          <Link href={`/product/${product.slug}`}>
            {product.name.replace(/^Areej /, "")}
          </Link>
        </h3>
        <p className="product-desc">{product.faq}</p>

        <div className="product-bottom">
          <div className="product-price-block">
            <span className="price-label">From</span>
            <span className="price-amount">
              {minPrice !== null && minPrice !== undefined
                ? `₹${minPrice.toLocaleString("en-IN")}`
                : "On request"}
            </span>
          </div>

          <button
            className={`card-quick-add ${added ? "added" : ""}`}
            onClick={quickAdd}
            aria-label={`Quick add ${product.name} to order`}
          >
            {added ? "✓ Added" : "+ Add"}
          </button>
        </div>
      </div>
    </article>
  );
}
