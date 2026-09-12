"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sync = () =>
      setCount(
        JSON.parse(localStorage.getItem("areej-enquiry") || "[]").reduce(
          (n: any, i: any) => n + i.qty,
          0
        )
      );
    sync();
    window.addEventListener("areej-cart", sync);
    return () => window.removeEventListener("areej-cart", sync);
  }, []);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const links = [
    ["Attar", "/attar"],
    ["Perfume", "/perfume"],
    ["Discovery", "/discovery"],
    ["Find Your Fragrance", "/find-your-fragrance"],
    ["Our Story", "/#story"],
    ["Contact", "/contact"]
  ];

  return (
    <header className="site-header" ref={headerRef}>
      <Link
        href="/"
        className="brand-lockup"
        aria-label="AREEJ Home"
        onClick={() => setOpen(false)}
      >
        <span className="header-logo">
          <Image src="/images/areej-logo.png" alt="AREEJ logo" fill sizes="40px" />
        </span>
        <span className="brand-name">AREEJ</span>
      </Link>
      <nav className={open ? "desktop-nav mobile-open" : "desktop-nav"}>
        {links.map(([n, h]) => (
          <Link key={h} href={h} onClick={() => setOpen(false)}>
            {n}
          </Link>
        ))}
        <Link
          href="/order-enquiry"
          className="order-link"
          onClick={() => setOpen(false)}
        >
          Place Order {count > 0 && <span>{count}</span>}
        </Link>
      </nav>
      <button
        className="menu-button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
      >
        {open ? "✕" : "☰"}
      </button>
    </header>
  );
}
