"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { products as seed, type Product } from "@/data/products";
import ProductCard from "@/components/ProductCard";

const gateways = [
  {
    pillar: "Pillar I",
    tag: "Concentrated Oils",
    title: "Pure Attar",
    desc: "Oriental, dehn al oud, and royal Indian heritage oils in pure concentrated form.",
    notes: "Taif Rose · Dehn Al Oud · Amber Resin",
    cta: "Explore Attars →",
    href: "/attar",
    bgClass: "gateway-attar"
  },
  {
    pillar: "Pillar II",
    tag: "Modern Extraits",
    title: "Fine Perfume",
    desc: "Contemporary extrait profiles across global modern fragrance culture.",
    notes: "Bergamot · French Lavender · Cardamom",
    cta: "Explore Perfumes →",
    href: "/perfume",
    bgClass: "gateway-perfume"
  },
  {
    pillar: "Pillar III",
    tag: "Curated Sets",
    title: "Discovery Experience",
    desc: "Curated 3 & 5 bottle routes for finding your personal signature.",
    notes: "Bespoke Flight · Discovery Sample Set",
    cta: "Build Your Set →",
    href: "/discovery",
    bgClass: "gateway-discovery"
  }
];

function select(
  ids: string[],
  all: Product[],
  fallback: Product[],
  limit: number
): Product[] {
  const chosen = ids.length
    ? (ids
        .map((id) => all.find((p) => p.slug === id))
        .filter(Boolean) as Product[])
    : fallback;
  return chosen.filter((p) => p.status !== "draft").slice(0, limit);
}

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(seed);
  const [featured, setFeatured] = useState<Product[]>(
    seed.filter((p) => p.featured).slice(0, 6)
  );
  const [best, setBest] = useState<Product[]>(
    seed.filter((p) => p.bestSeller).slice(0, 4)
  );
  const [activeGateway, setActiveGateway] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const prevGateway = () =>
    setActiveGateway((prev) => (prev - 1 + gateways.length) % gateways.length);
  const nextGateway = () =>
    setActiveGateway((prev) => (prev + 1) % gateways.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (diffX > 35) {
      nextGateway();
    } else if (diffX < -35) {
      prevGateway();
    }
    touchStartX.current = null;
  };

  const handleCardClick = (idx: number, href: string) => {
    if (idx === activeGateway) {
      router.push(href);
    } else {
      setActiveGateway(idx);
    }
  };

  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem("areej-admin-products") || "null"
    );
    const activeProducts: Product[] = saved || seed;
    setProducts(activeProducts);

    const ids: string[] = JSON.parse(
      localStorage.getItem("areej-featured") || "[]"
    );
    const bids: string[] = JSON.parse(
      localStorage.getItem("areej-best") || "[]"
    );

    setFeatured(
      select(
        ids,
        activeProducts,
        activeProducts.filter((p) => p.featured),
        6
      )
    );
    setBest(
      select(
        bids,
        activeProducts,
        activeProducts.filter((p) => p.bestSeller),
        4
      )
    );
  }, []);

  // Scroll-Triggered Reveal Animations Observer
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    const targets = document.querySelectorAll(".scroll-reveal, .scroll-stagger");
    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [featured, best]);

  return (
    <main className="landing-main">
      {/* 1. HERO SECTION (Light, serene entrance animation) */}
      <section className="home-hero hero-light-enter">
        <div className="home-hero-image" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow">AREEJ · The House of Fragrance</p>
          <h1>
            <span className="hero-display">
              A fragrance house
              <br />
              rooted in heritage.
            </span>
          </h1>
          <p className="hero-description">
            Concentrated attars, modern perfumes and discovery-led journeys — crafted for the way
            fragrance is experienced today.
          </p>
          <div className="hero-actions">
            <Link href="/find-your-fragrance" className="gold-button">
              Find Your Fragrance
            </Link>
            <Link href="/attar" className="outline-button">
              Explore the House
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE AREEJ PHILOSOPHY (Directly below Hero section with smooth scroll text-reveal) */}
      <section className="manifesto scroll-reveal">
        <p className="eyebrow">The AREEJ philosophy</p>
        <h2>
          <span className="split-line">
            <span>Fragrance is memory,</span>
          </span>
          <span className="split-line">
            <span>presence and identity.</span>
          </span>
        </h2>
        <p>
          We bring concentrated fragrance closer to the way it should be experienced:
          slowly, personally and with character. Explore oils, perfumes and discovery-led
          journeys, then place your order through the channel that suits you.
        </p>
      </section>

      {/* 3. GATEWAY SECTION: Architectural Portals Showcase */}
      <section className="gateway-section scroll-reveal">
        <div className="section-heading centered">
          <p className="eyebrow">Discover AREEJ</p>
          <h2>Three ways to enter the house.</h2>
          <p className="section-subhead">
            Step into our heritage oils, contemporary extraits, or curated discovery flights.
          </p>
        </div>

        {/* Mobile Pillar Tabs */}
        <div className="gateway-pillar-tabs" role="tablist" aria-label="Fragrance Collections">
          {gateways.map((g, idx) => (
            <button
              key={g.href}
              type="button"
              role="tab"
              aria-selected={idx === activeGateway}
              className={`pillar-tab ${idx === activeGateway ? "active" : ""}`}
              onClick={() => setActiveGateway(idx)}
            >
              <span className="pillar-tab-dot" />
              <span>{g.title.replace(" Experience", "")}</span>
            </button>
          ))}
        </div>

        <div
          className="gateway-stage-wrapper"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            className="stage-nav-btn prev-btn"
            onClick={prevGateway}
            aria-label="Previous collection"
          >
            ‹
          </button>

          <div className="gateway-portals">
            {gateways.map((g, idx) => {
              const isActive = idx === activeGateway;

              return (
                <div
                  key={g.href}
                  className={`gateway-portal ${g.bgClass} ${isActive ? "active-portal" : "inactive-portal"}`}
                  onClick={() => handleCardClick(idx, g.href)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick(idx, g.href);
                    }
                  }}
                  aria-label={`Enter ${g.title} collection`}
                >
                  <div className="portal-frame" aria-hidden="true" />
                  <div className="portal-header">
                    <span className="portal-pillar-tag">{g.pillar} · {g.tag}</span>
                  </div>
                  <div className="portal-body">
                    <h3>{g.title}</h3>
                    <p className="portal-desc">{g.desc}</p>
                    <span className="portal-notes">{g.notes}</span>
                  </div>
                  <div className="portal-footer">
                    <span className="portal-cta">
                      {g.cta}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="stage-nav-btn next-btn"
            onClick={nextGateway}
            aria-label="Next collection"
          >
            ›
          </button>
        </div>
      </section>

      {/* 4. FEATURED SIGNATURES (2-Column Mobile Grid with Staggered Scroll Reveal) */}
      <section className="featured-section scroll-reveal">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Curated by AREEJ</p>
            <h2>Explore the signatures.</h2>
          </div>
          <Link href="/perfume" className="text-button section-link">
            View all ({products.length}) →
          </Link>
        </div>
        <div className="product-grid scroll-stagger">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* 5. BEST SELLERS (2-Column Mobile Grid with Staggered Scroll Reveal) */}
      <section className="best-seller-strip scroll-reveal">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Customer favourites</p>
            <h2>Best sellers.</h2>
          </div>
          <Link href="/attar" className="text-button section-link">
            Explore attars →
          </Link>
        </div>
        <div className="product-grid scroll-stagger">
          {best.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* 6. INTERACTIVE FRAGRANCE FINDER BANNER */}
      <section className="finder-banner scroll-reveal">
        <div className="finder-banner-inner">
          <p className="eyebrow">Personalized curation</p>
          <h2>Not sure where to begin?</h2>
          <p>
            Select your preferred olfactory direction or let our guided finder match
            the ideal AREEJ formulation to your personal taste.
          </p>

          <div className="finder-mood-chips scroll-stagger">
            <Link href="/find-your-fragrance" className="mood-chip">
              <span>🪵</span> Woody & Smoky
            </Link>
            <Link href="/find-your-fragrance" className="mood-chip">
              <span>🍬</span> Sweet & Gourmand
            </Link>
            <Link href="/find-your-fragrance" className="mood-chip">
              <span>🌊</span> Fresh & Citrus
            </Link>
            <Link href="/find-your-fragrance" className="mood-chip">
              <span>🌹</span> Royal Floral
            </Link>
          </div>

          <Link href="/find-your-fragrance" className="gold-button">
            Start the Fragrance Finder →
          </Link>
        </div>
      </section>

      {/* 7. BRAND STORY SECTION */}
      <section className="story-section scroll-reveal" id="story">
        <div className="story-mark">A</div>
        <div className="story-content">
          <p className="eyebrow">The house of AREEJ</p>
          <h2>Old-world inspiration. Modern restraint.</h2>
          <p>
            AREEJ pairs the visual language of Eastern ornament with an editorial,
            contemporary discipline. Our collection honors Arabian and Middle
            Eastern traditions, niche luxury accords, and pure Indian heritage attars.
          </p>
          <p className="arabic-line" lang="ar">
            العطر ذاكرة لا تُرى
          </p>
        </div>
      </section>
    </main>
  );
}