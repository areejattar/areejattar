"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  const prices = Object.values(product.prices ?? {}).filter(
    (value): value is number => typeof value === "number"
  );

  const minPrice = prices.length > 0 ? Math.min(...prices) : product.price;

  return (
    <article className="product-card">
      <Link
        href={`/product/${product.slug}`}
        className="product-image-wrap"
      >
        {product.image.startsWith("data:") ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 700px) 50vw, 25vw"
          />
        )}
      </Link>

      <div className="product-info">
        <p className="eyebrow">
          {product.collection} · {product.sku}
        </p>

        <h3>{product.name.replace(/^Areej /, "")}</h3>
        <p>{product.faq}</p>

        <div className="product-bottom">
          <span>
            {minPrice !== null && minPrice !== undefined
              ? `From ₹${minPrice.toLocaleString("en-IN")}`
              : "Price on request"}
          </span>

          <Link
            href={`/product/${product.slug}`}
            className="text-button"
          >
            Explore
          </Link>
        </div>
      </div>
    </article>
  );
}
