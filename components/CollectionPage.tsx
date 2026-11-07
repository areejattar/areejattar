"use client";

import { useEffect, useState } from "react";
import { collectionMeta, type Collection, type Product } from "@/data/products";
import { fetchPublicCatalog, mapPublicProducts } from "@/lib/public-catalogue";
import CatalogueBrowser from "./CatalogueBrowser";

export default function CollectionPage({ collection }: { collection: Collection }) {
  const meta = collectionMeta[collection];
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchPublicCatalog()
      .then((data) => {
        if (!cancelled) setProducts(mapPublicProducts(data, collection));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load catalogue.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [collection]);

  return (
    <main className={`collection-page theme-${collection}`}>
      <section className="collection-hero">
        <div className="collection-copy">
          <p className="eyebrow">AREEJ / {collection}</p>
          <h1>{meta.title}</h1>
          <p className="collection-subtitle">{meta.subtitle}</p>
          <p>{meta.description}</p>
        </div>
      </section>
      <section className="collection-products">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Catalogue</p>
            <h2>Find your signature.</h2>
          </div>
        </div>
        {loading ? <p className="catalogue-status">Loading published fragrances...</p> : null}
        {error ? <p className="catalogue-status" role="alert">{error}</p> : null}
        {!loading && !error ? <CatalogueBrowser products={products} /> : null}
      </section>
    </main>
  );
}
