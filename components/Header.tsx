"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header(){
  const [open,setOpen]=useState(false); const [count,setCount]=useState(0);
  useEffect(()=>{ const sync=()=>setCount(JSON.parse(localStorage.getItem("areej-enquiry")||"[]").reduce((n:any,i:any)=>n+i.qty,0)); sync(); window.addEventListener("areej-cart",sync); return()=>window.removeEventListener("areej-cart",sync)},[]);
  const links=[["Attar","/attar"],["Perfume","/perfume"],["Discovery","/discovery"],["Find Your Fragrance","/find-your-fragrance"],["Our Story","/#story"],["Contact","/contact"]];
  return <header className="site-header"><Link href="/" className="brand-lockup" aria-label="AREEJ Home"><span className="header-logo"><Image src="/images/areej-logo.png" alt="AREEJ logo" fill sizes="40px"/></span><span className="brand-name">AREEJ</span></Link>
  <nav className={open?"desktop-nav mobile-open":"desktop-nav"}>{links.map(([n,h])=><Link key={h} href={h} onClick={()=>setOpen(false)}>{n}</Link>)}<Link href="/order-enquiry" className="order-link">Place Order {count>0&&<span>{count}</span>}</Link></nav>
  <button className="menu-button" aria-label="Menu" onClick={()=>setOpen(!open)}>☰</button></header>
}
