"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import DiscoveryBuilder from "@/components/DiscoveryBuilder";

export default function Page() {
  const [active, setActive] = useState<"attar" | "perfume">("attar");

  return (
    <main className="theme-discovery collection-page discovery-page-image-hero">
      {/* The supplied artwork already contains the AREEJ logo and headline.
          Keep this hero image-only; do not overlay another heading or CTA. */}
      <section className="discovery-artwork-hero" aria-label="Find Your Fragrance">
        <Image
          src="/images/discovery-hero.png"
          alt="AREEJ — Find Your Fragrance"
          width={1376}
          height={768}
          priority
          sizes="100vw"
          className="discovery-artwork-image"
        />
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
            <DiscoveryBuilder collection={active} />
        </div>

        <div className="discovery-cards">
          <Link href="/find-your-fragrance">
            <h3>Find Your Fragrance</h3>
            <p>Answer a few questions and get recommendations.</p>
          </Link>
          <Link href="/attar">
            <h3>Explore Attar</h3>
            <p>Discover the Indian heritage and oriental oil direction.</p>
          </Link>
          <Link href="/perfume">
            <h3>Explore Perfume</h3>
            <p>Browse modern profiles and global fragrance directions.</p>
          </Link>
        </div>
      </section>

      <div className="trial-marquee" aria-label="Discovery trial message">
        <div className="trial-marquee-track">
          <span>NO MINIMUM ORDER VALUE ON TRIALS</span>
          <span>✦</span>
          <span>NO MINIMUM ORDER VALUE ON TRIALS</span>
          <span>✦</span>
          <span>NO MINIMUM ORDER VALUE ON TRIALS</span>
          <span>✦</span>
        </div>
      </div>

      <style jsx global>{`
        .discovery-page-image-hero .discovery-artwork-hero {
          width: 100%;
          margin: 0;
          padding: 0;
          height: clamp(560px, 48vw, 760px);
          overflow: hidden;
          line-height: 0;
          background: #190706;
        }

        .discovery-page-image-hero .discovery-artwork-image {
          display: block;
          width: 100%;
          height: 100%;
          max-width: 100%;
          object-fit: cover;
          object-position: center;
        }

        @media (max-width: 640px) {
          .discovery-page-image-hero .discovery-artwork-hero {
            height: clamp(340px, 85vw, 500px);
          }

          .discovery-page-image-hero .discovery-artwork-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
          }
        }
      `}</style>
    </main>
  );
}
