"use client";
import { useState } from "react";

export default function OrderActions({ message }: { message: string }) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(message);
  const whatsapp = `https://wa.me/918087995062?text=${encoded}`;
  const email = `mailto:contact@areejattar.in?subject=${encodeURIComponent("AREEJ Place Order")}&body=${encoded}`;

  async function instagram() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3500);
    } catch {}
    window.open("https://ig.me/m/areejattar72", "_blank", "noopener,noreferrer");
  }

  return <div className="order-actions">
    <a className="gold-button" href={whatsapp} target="_blank" rel="noreferrer">Place Order via WhatsApp</a>
    <a className="outline-button" href={email}>Place Order via Email</a>
    <button className="outline-button" onClick={instagram}>Place Order via Insta</button>
    {copied && <p className="channel-note">Your order message has been copied. Instagram opened in a new tab — paste the message into the AREEJ chat.</p>}
  </div>;
}
