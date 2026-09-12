"use client";

import Link from "next/link";
import { useState } from "react";
import { products } from "@/data/products";
import DiscoveryBuilder from "@/components/DiscoveryBuilder";

export default function Page() {
  const [active, setActive] = useState<"attar" | "perfume">("attar");

  return (
    <main className="theme-discovery collection-page">
      <section className="collection-hero discovery-hero">
        <div className="collection-art" aria-hidden="true" />
        <div className="collection-copy">
          <p className="eyebrow">AREEJ / Discovery</p>
          <h1>Find your way in.</h1>
          <p className="collection-subtitle">Trial a fragrance world before choosing your signature.</p>
          <p>Build a set of 3 or 5 different fragrances in a small trial size. Ideal for discovering, comparing and gifting.</p>
          <Link href="/find-your-fragrance" className="gold-button">Find Your Fragrance</Link>
        </div>
      </section>

      <section className="collection-products discovery-area">
        <div className="discovery-switcher" role="tablist" aria-label="Discovery type">
          <button
            type="button"
            role="tab"
            aria-selected={active === "attar"}
            className={active === "attar" ? "selected" : ""}
            onClick={() => setActive("attar")}
          >
            Attar Discovery
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={active === "perfume"}
            className={active === "perfume" ? "selected" : ""}
            onClick={() => setActive("perfume")}
          >
            Perfume Discovery
          </button>
        </div>

        <div className="discovery-tab-panel">
          <DiscoveryBuilder products={products} collection={active} />
        </div>

        <div className="discovery-cards">
          <Link href="/find-your-fragrance"><h3>Find Your Fragrance</h3><p>Answer a few questions and get recommendations.</p></Link>
          <Link href="/attar"><h3>Explore Attar</h3><p>Discover the Indian heritage and oriental oil direction.</p></Link>
          <Link href="/perfume"><h3>Explore Perfume</h3><p>Browse modern profiles and global fragrance directions.</p></Link>
        </div>
      </section>

      <div className="trial-marquee" aria-label="Discovery trial message">
        <div className="trial-marquee-track">
          <span>NO MINIMUM ORDER VALUE ON TRIALS</span><span>✦</span><span>NO MINIMUM ORDER VALUE ON TRIALS</span><span>✦</span><span>NO MINIMUM ORDER VALUE ON TRIALS</span><span>✦</span>
        </div>
      </div>
    </main>
  );
}
