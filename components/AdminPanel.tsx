"use client";
import { useEffect, useMemo, useState } from "react";
import { products as seed } from "@/data/products";

type OrderSettings = { minOrderEnabled:boolean; minOrderValue:number; freeDeliveryThreshold:number; deliveryCharge:number; trial3mlEnabled:boolean; trial3mlPrice:number|null };
type DiscoveryConfig = { enabled:boolean; options:number[]; sizes:string[] };
const defaultOrder:OrderSettings={minOrderEnabled:true,minOrderValue:599,freeDeliveryThreshold:1000,deliveryCharge:75,trial3mlEnabled:true,trial3mlPrice:null};
const defaultDiscovery:Record<"attar"|"perfume",DiscoveryConfig>={
  attar:{enabled:true,options:[3,5],sizes:["3 ML","6 ML"]},
  perfume:{enabled:true,options:[3,5],sizes:["5 ML","10 ML"]}
};

function getMinPrice(prices?: Record<string, number | null>, fallback?: number | null): number {
  const vals = Object.values(prices || {}).filter((x): x is number => typeof x === "number");
  return vals.length ? Math.min(...vals) : (fallback ?? 0);
}

export default function AdminPanel({authenticated}:{authenticated:boolean}){
  const [password,setPassword]=useState(""); const [ok,setOk]=useState(authenticated); const [items,setItems]=useState<any[]>([]); const [q,setQ]=useState(""); const [editing,setEditing]=useState<any|null>(null); const [tab,setTab]=useState("products");
  const [featured,setFeatured]=useState<string[]>([]); const [best,setBest]=useState<string[]>([]); const [finder,setFinder]=useState<string[]>([]);
  const [orderSettings,setOrderSettings]=useState<OrderSettings>(defaultOrder); const [discovery,setDiscovery]=useState(defaultDiscovery); const [discoveryTab,setDiscoveryTab]=useState<"attar"|"perfume">("attar");

  useEffect(()=>{
    setItems(JSON.parse(localStorage.getItem("areej-admin-products")||"null")||seed);
    setFeatured(JSON.parse(localStorage.getItem("areej-featured")||"[]"));
    setBest(JSON.parse(localStorage.getItem("areej-best")||"[]"));
    setFinder(JSON.parse(localStorage.getItem("areej-finder")||"[]"));
    setOrderSettings({...defaultOrder,...(JSON.parse(localStorage.getItem("areej-order-settings")||"{}"))});
    const savedAttar=JSON.parse(localStorage.getItem("areej-discovery-attar")||"null");
    const savedPerfume=JSON.parse(localStorage.getItem("areej-discovery-perfume")||"null");
    const legacy=JSON.parse(localStorage.getItem("areej-discovery-config")||"null");
    setDiscovery({
      attar:{...defaultDiscovery.attar,...(savedAttar||legacy||{})},
      perfume:{...defaultDiscovery.perfume,...(savedPerfume||{})}
    });
  },[]);
  async function login(e:any){e.preventDefault();const r=await fetch("/api/admin/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({password})});if(r.ok){setOk(true);setPassword("")}else alert("Invalid admin password")}
  function persist(){
    localStorage.setItem("areej-admin-products",JSON.stringify(items));
    localStorage.setItem("areej-featured",JSON.stringify(featured));
    localStorage.setItem("areej-best",JSON.stringify(best));
    localStorage.setItem("areej-finder",JSON.stringify(finder));
    localStorage.setItem("areej-order-settings",JSON.stringify(orderSettings));
    localStorage.setItem("areej-discovery-attar",JSON.stringify(discovery.attar));
    localStorage.setItem("areej-discovery-perfume",JSON.stringify(discovery.perfume));
    localStorage.setItem("areej-discovery-config",JSON.stringify(discovery.attar));
    alert("Admin settings saved in this browser.");
  }
  function logout(){fetch("/api/admin/login",{method:"DELETE"}).finally(()=>setOk(false))}
  function update(k:string,v:any){setEditing({...editing,[k]:v})}
  function updateSize(size:string,value:string){const prices={...(editing.prices||{})};prices[size]=value===""?null:Number(value);const opts=Object.entries(prices).filter(([,v])=>v!==null).map(([k])=>k);setEditing({...editing,prices,sizeOptions:opts,price:prices["6 ML"]??editing.price})}
  function commit(){setItems(items.map(p=>p.slug===editing.slug?editing:p));setEditing(null)}
  function addImage(e:any){const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const canvas=document.createElement("canvas");const max=900;const scale=Math.min(1,max/Math.max(img.width,img.height));canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext("2d")!.drawImage(img,0,0,canvas.width,canvas.height);update("image",canvas.toDataURL("image/jpeg",.82));};img.src=String(reader.result)};reader.readAsDataURL(file)}
  function toggle(setter:any,list:string[],slug:string){setter(list.includes(slug)?list.filter(x=>x!==slug):[...list,slug])}
  const filtered=useMemo(()=>items.filter(p=>(p.name+" "+p.sku+" "+p.category).toLowerCase().includes(q.toLowerCase())),[items,q]);
  if(!ok)return <main className="admin-login"><div className="admin-login-card"><img src="/images/areej-logo.png" alt="AREEJ" className="admin-login-logo"/><p className="eyebrow">Private area</p><h1>AREEJ Admin</h1><p>Authorised catalogue, discovery and ordering controls.</p><form onSubmit={login}><input type="password" placeholder="Admin password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/><button className="gold-button full-width">Sign in</button></form><small>Set <code>ADMIN_PASSWORD</code> in Vercel Environment Variables before deployment.</small></div></main>;
  const merch=(list:string[],setter:any)=><div className="merch-list">{items.map(p=><label key={p.slug}><input type="checkbox" checked={list.includes(p.slug)} onChange={()=>toggle(setter,list,p.slug)}/><span>{p.name.replace(/^Areej /,"")} <small>{p.sku}</small></span></label>)}</div>;
  const d=discovery[discoveryTab];
  const setD=(patch:Partial<DiscoveryConfig>)=>setDiscovery(prev=>({...prev,[discoveryTab]:{...prev[discoveryTab],...patch}}));
  return <main className="admin-page"><div className="admin-top"><div><p className="eyebrow">AREEJ / Admin</p><h1>Control room</h1><p>Manage catalogue, merchandising and order rules.</p></div><div><button onClick={persist} className="gold-button">Save changes</button> <button onClick={logout} className="outline-button">Sign out</button></div></div>
    <div className="admin-tabs"><button className={tab==="products"?"selected":""} onClick={()=>setTab("products")}>Products</button><button className={tab==="signatures"?"selected":""} onClick={()=>setTab("signatures")}>Explore the Signatures</button><button className={tab==="bestsellers"?"selected":""} onClick={()=>setTab("bestsellers")}>Best Sellers</button><button className={tab==="finder"?"selected":""} onClick={()=>setTab("finder")}>Find Your Fragrance</button><button className={tab==="discovery"?"selected":""} onClick={()=>setTab("discovery")}>Discovery Sets</button><button className={tab==="orders"?"selected":""} onClick={()=>setTab("orders")}>Order Rules</button></div>
    {tab==="products"&&<><div className="admin-toolbar"><input placeholder="Search catalogue..." value={q} onChange={e=>setQ(e.target.value)}/><span>{items.length} products</span></div><div className="admin-table">{filtered.map(p=><div className="admin-row" key={p.slug}><div><strong>{p.name.replace(/^Areej /,"")}</strong><small>{p.sku} · {p.collection}</small></div><div>From ₹{getMinPrice(p.prices, p.price)}</div><button onClick={()=>setEditing({...p})}>Edit</button></div>)}</div></>}
    {tab==="signatures"&&<div className="merch-grid"><div><h2>Explore the Signatures</h2><p>Select which products appear in the homepage signature collection. The first 6 selected are displayed.</p></div>{merch(featured,setFeatured)}</div>}
    {tab==="bestsellers"&&<div className="merch-grid"><div><h2>Best Sellers</h2><p>Select which products appear in the homepage best-seller section. The first 4 selected are displayed.</p></div>{merch(best,setBest)}</div>}
    {tab==="finder"&&<div className="merch-grid"><div><h2>Explore First</h2><p>Select the products that the fragrance finder should prioritise.</p></div>{merch(finder,setFinder)}</div>}
    {tab==="discovery"&&<div className="settings-card"><h2>Discovery Sets</h2><p>Customers can build either a set of 3 or 5 different fragrances. Each collection has its own trial sizes and both are priced automatically from each product's 30 ML catalogue price.</p><div className="admin-tabs discovery-admin-tabs"><button className={discoveryTab==="attar"?"selected":""} onClick={()=>setDiscoveryTab("attar")}>Attar Discovery</button><button className={discoveryTab==="perfume"?"selected":""} onClick={()=>setDiscoveryTab("perfume")}>Perfume Discovery</button></div><label className="switch-line"><input type="checkbox" checked={d.enabled} onChange={e=>setD({enabled:e.target.checked})}/> Enable {discoveryTab} discovery</label><h3>Set sizes</h3><div className="choice-row">{[3,5].map(n=><button key={n} className={d.options.includes(n)?"selected":""} onClick={()=>setD({options:d.options.includes(n)?d.options.filter(x=>x!==n):[...d.options,n].sort()})}>{n} products</button>)}</div><h3>Allowed trial sizes</h3><div className="choice-row">{d.sizes.map(s=><button key={s} className="selected" onClick={()=>setD({sizes:d.sizes.filter(x=>x!==s)})}>{s} ×</button>)}<button onClick={()=>{const next=discoveryTab==="attar"?["3 ML","6 ML","9 ML"]:["5 ML","10 ML","15 ML"];setD({sizes:Array.from(new Set([...d.sizes,next.find(x=>!d.sizes.includes(x))!]))})}}>+ Add size</button></div><div className="admin-help"><strong>Automatic discovery pricing:</strong> 30 ML price ÷ 30 × selected trial ML, then rounded up to the next rupee. Example: a ₹350 / 30 ML product is ₹35 for 3 ML and ₹70 for 6 ML. No separate discovery price table is required.</div></div>}
    {tab==="orders"&&<div className="settings-card"><h2>Order & Delivery Rules</h2><div className="settings-grid"><label className="switch-line"><input type="checkbox" checked={orderSettings.minOrderEnabled} onChange={e=>setOrderSettings({...orderSettings,minOrderEnabled:e.target.checked})}/> Enable minimum order</label><label>Minimum order value<input type="number" value={orderSettings.minOrderValue} onChange={e=>setOrderSettings({...orderSettings,minOrderValue:Number(e.target.value)})}/></label><label>Free delivery from<input type="number" value={orderSettings.freeDeliveryThreshold} onChange={e=>setOrderSettings({...orderSettings,freeDeliveryThreshold:Number(e.target.value)})}/></label><label>Delivery charge below threshold<input type="number" value={orderSettings.deliveryCharge} onChange={e=>setOrderSettings({...orderSettings,deliveryCharge:Number(e.target.value)})}/></label><label className="switch-line"><input type="checkbox" checked={orderSettings.trial3mlEnabled} onChange={e=>setOrderSettings({...orderSettings,trial3mlEnabled:e.target.checked})}/> Show 3 ML trial suggestions on order page</label><label>3 ML trial price per bottle<input type="number" value={orderSettings.trial3mlPrice??""} onChange={e=>setOrderSettings({...orderSettings,trial3mlPrice:e.target.value===""?null:Number(e.target.value)})} placeholder="Set price"/></label></div><div className="admin-help"><strong>Current customer rule:</strong> {orderSettings.minOrderEnabled?`Minimum ₹${orderSettings.minOrderValue}; `:"No minimum order; "}free delivery at ₹{orderSettings.freeDeliveryThreshold}+ and ₹{orderSettings.deliveryCharge} delivery below that.</div></div>}
    {editing&&<div className="modal"><div className="modal-card admin-editor"><div className="modal-header"><div><p className="eyebrow">Catalogue editor</p><h2>Edit product</h2></div><button className="modal-close" onClick={()=>setEditing(null)}>×</button></div><label>Product name<input value={editing.name} onChange={e=>update("name",e.target.value)}/></label><label>Base SKU / product numbering<input value={editing.sku} onChange={e=>update("sku",e.target.value)}/></label><div className="sku-grid"><label>6 ML SKU<input value={editing.sku6||""} onChange={e=>update("sku6",e.target.value)}/></label><label>12 ML SKU<input value={editing.sku12||""} onChange={e=>update("sku12",e.target.value)}/></label></div><h3>Sizes & prices</h3><div className="sku-grid">{["3 ML","5 ML","6 ML","10 ML","12 ML","20 ML","30 ML","50 ML"].map(s=><label key={s}>{s}<input type="number" value={editing.prices?.[s]??""} onChange={e=>updateSize(s,e.target.value)} placeholder="N/A"/></label>)}</div><label>Replace product image<input type="file" accept="image/*" onChange={addImage}/></label>{editing.image&&<img className="admin-preview" src={editing.image} alt="Preview"/>}<label>Image URL (optional)<input value={editing.image?.startsWith("data:")?"":editing.image} onChange={e=>update("image",e.target.value)}/></label><label>Status<select value={editing.status} onChange={e=>update("status",e.target.value)}><option>published</option><option>draft</option></select></label><label>Fragrance description<textarea value={editing.faq} onChange={e=>update("faq",e.target.value)}/></label><div className="editor-actions"><button className="gold-button" onClick={commit}>Update Product</button><button className="outline-button" onClick={()=>setEditing(null)}>Cancel</button></div></div></div>}
  </main>
}
