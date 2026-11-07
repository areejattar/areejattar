
"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type OrderSettings = {
  minOrderEnabled: boolean;
  minOrderValue: number;
  freeDeliveryThreshold: number;
  deliveryCharge: number;
  trial3mlEnabled: boolean;
  trial3mlPrice: number | null;
};

type DiscoveryConfig = {
  enabled: boolean;
  options: number[];
  sizes: string[];
};

const defaultOrder: OrderSettings = {
  minOrderEnabled: true,
  minOrderValue: 599,
  freeDeliveryThreshold: 1000,
  deliveryCharge: 75,
  trial3mlEnabled: true,
  trial3mlPrice: null,
};

const defaultDiscovery: Record<"attar" | "perfume", DiscoveryConfig> = {
  attar: { enabled: true, options: [3, 5], sizes: ["3 ML", "6 ML"] },
  perfume: { enabled: true, options: [3, 5], sizes: ["5 ML", "10 ML"] },
};

function getMinPrice(
  prices?: Record<string, number | null>,
  fallback?: number | null
): number {
  const vals = Object.values(prices || {}).filter(
    (x): x is number => typeof x === "number"
  );

  return vals.length ? Math.min(...vals) : (fallback ?? 0);
}

export default function AdminPanel({
  authenticated,
}: {
  authenticated: boolean;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [ok, setOk] = useState(authenticated);

  const [items, setItems] = useState<any[]>([]);
  const [dirtySlugs, setDirtySlugs] = useState<string[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [editingIsNew, setEditingIsNew] = useState(false);
  const [newSlugs, setNewSlugs] = useState<string[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [newFormats, setNewFormats] = useState({ attar: true, perfume: false });
  const [tab, setTab] = useState("products");

  const [featured, setFeatured] = useState<string[]>([]);
  const [best, setBest] = useState<string[]>([]);
  const [finder, setFinder] = useState<string[]>([]);

  const [orderSettings, setOrderSettings] =
    useState<OrderSettings>(defaultOrder);

  const [discovery, setDiscovery] = useState(defaultDiscovery);
  const [discoveryTab, setDiscoveryTab] =
    useState<"attar" | "perfume">("attar");
  const [storeAvailability, setStoreAvailability] = useState({
    attarEnabled: true,
    perfumeEnabled: true,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    setFeatured(
      JSON.parse(localStorage.getItem("areej-featured") || "[]")
    );

    setBest(JSON.parse(localStorage.getItem("areej-best") || "[]"));

    setFinder(JSON.parse(localStorage.getItem("areej-finder") || "[]"));

    setOrderSettings({
      ...defaultOrder,
      ...(JSON.parse(
        localStorage.getItem("areej-order-settings") || "{}"
      )),
    });

    const savedAttar = JSON.parse(
      localStorage.getItem("areej-discovery-attar") || "null"
    );

    const savedPerfume = JSON.parse(
      localStorage.getItem("areej-discovery-perfume") || "null"
    );

    const legacy = JSON.parse(
      localStorage.getItem("areej-discovery-config") || "null"
    );

    setDiscovery({
      attar: {
        ...defaultDiscovery.attar,
        ...(savedAttar || legacy || {}),
      },
      perfume: {
        ...defaultDiscovery.perfume,
        ...(savedPerfume || {}),
      },
    });
  }, []);

  // Load server-side draft settings. Existing browser settings are retained as
  // a fallback until they have been migrated to PostgreSQL.
  useEffect(() => {
    if (!ok) return;

    let cancelled = false;

    async function loadSettings() {
      setSettingsLoading(true);
      setSettingsError("");

      try {
        const response = await fetch("/api/admin/settings", {
          method: "GET",
          cache: "no-store",
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success || !data.draftConfig) {
          throw new Error(data?.message || "Unable to load settings from PostgreSQL.");
        }

        if (cancelled) return;

        const config = data.draftConfig;
        if (config.storeAvailability && typeof config.storeAvailability === "object") {
          setStoreAvailability((current) => ({
            ...current,
            ...config.storeAvailability,
          }));
        }

        if (config.merchandising && typeof config.merchandising === "object") {
          if (Array.isArray(config.merchandising.featured)) setFeatured(config.merchandising.featured);
          if (Array.isArray(config.merchandising.best)) setBest(config.merchandising.best);
          if (Array.isArray(config.merchandising.finder)) setFinder(config.merchandising.finder);
        }

        if (config.orderSettings && typeof config.orderSettings === "object") {
          setOrderSettings({ ...defaultOrder, ...config.orderSettings });
        }

        if (config.discovery && typeof config.discovery === "object") {
          setDiscovery({
            attar: { ...defaultDiscovery.attar, ...(config.discovery.attar || {}) },
            perfume: { ...defaultDiscovery.perfume, ...(config.discovery.perfume || {}) },
          });
        }
      } catch (error) {
        console.error("Admin settings load error:", error);
        if (!cancelled) {
          setSettingsError(
            error instanceof Error ? error.message : "Unable to load admin settings."
          );
        }
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, [ok]);

  // Product catalogue is loaded from PostgreSQL, never from browser storage.
  useEffect(() => {
    if (!ok) return;

    let cancelled = false;

    async function loadProducts() {
      setProductsLoading(true);
      setProductsError("");

      try {
        const response = await fetch("/api/admin/products", {
          method: "GET",
          cache: "no-store",
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success || !Array.isArray(data.products)) {
          throw new Error(data?.message || "Unable to load products from the database.");
        }

        if (!cancelled) {
          const loaded = data.products.map((row: any) => ({
            ...(row.draft_data || {}),
            slug: row.slug,
          }));
          setItems(loaded);
          setDirtySlugs([]);
        }
      } catch (error) {
        console.error("Admin products load error:", error);
        if (!cancelled) {
          setProductsError(
            error instanceof Error ? error.message : "Unable to load products."
          );
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [ok]);

  async function login(e: any) {
    e.preventDefault();

    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (r.ok) {
        setOk(true);
        setUsername("");
        setPassword("");
      } else {
        alert("Invalid admin username or password");
      }
    } catch (error) {
      console.error("Admin login failed:", error);
      alert("Unable to connect. Please try again.");
    }
  }

  async function persist(): Promise<boolean> {
    try {
      // Save only products changed in this editing session.
      for (const slug of dirtySlugs) {
        const product = items.find((item) => item.slug === slug);
        if (!product) continue;

        const isNew = newSlugs.includes(slug);
        const response = await fetch("/api/admin/products", {
          method: isNew ? "POST" : "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug, draftData: product }),
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || `Unable to save ${slug}.`);
        }
      }

      // Save all non-product settings as PostgreSQL drafts. This also migrates
      // any settings that were previously stored only in this browser.
      const settingsResponse = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          draftConfig: {
            storeAvailability,
            merchandising: { featured, best, finder },
            discovery,
            orderSettings,
          },
        }),
      });
      const settingsData = await settingsResponse.json().catch(() => null);

      if (!settingsResponse.ok || !settingsData?.success) {
        throw new Error(settingsData?.message || "Unable to save admin settings to PostgreSQL.");
      }

      setDirtySlugs([]);
      setNewSlugs([]);
      alert(
        dirtySlugs.length
          ? `Saved ${dirtySlugs.length} product draft(s) and all admin settings to PostgreSQL.`
          : "All admin settings saved as PostgreSQL drafts."
      );
      return true;
    } catch (error) {
      console.error("Admin save error:", error);
      alert(error instanceof Error ? error.message : "Unable to save admin changes.");
      return false;
    }
  }

  async function publishChanges() {
    if (publishing || productsLoading || settingsLoading || productsError || settingsError) {
      return;
    }

    const confirmed = window.confirm(
      "Publish all saved product and site-setting drafts? This will make them visible to customers immediately."
    );
    if (!confirmed) return;

    setPublishing(true);
    try {
      // Ensure current edits are persisted as drafts before the atomic publish.
      const saved = await persist();
      if (!saved) return;

      const response = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Unable to publish changes.");
      }

      alert(
        `Publishing successful. ${data.productsPublished} products and site settings are now live.`
      );
    } catch (error) {
      console.error("Admin publish error:", error);
      alert(error instanceof Error ? error.message : "Unable to publish changes.");
    } finally {
      setPublishing(false);
    }
  }

  function logout() {
    fetch("/api/admin/login", { method: "DELETE" }).finally(() =>
      setOk(false)
    );
  }

  function update(k: string, v: any) {
    setEditing({ ...editing, [k]: v });
  }

  function updateSize(size: string, value: string) {
    const prices = { ...(editing.prices || {}) };

    prices[size] = value === "" ? null : Number(value);

    const opts = Object.entries(prices)
      .filter(([, v]) => v !== null)
      .map(([k]) => k);

    setEditing({
      ...editing,
      prices,
      sizeOptions: opts,
      price: prices["6 ML"] ?? editing.price,
    });
  }

  function openNewProduct() {
    setEditingIsNew(true);
    setNewFormats({ attar: true, perfume: false });
    setEditing({
      slug: "", name: "", sku: "", sku6: "", sku12: "",
      sku30: "", sku50: "", sku100: "",
      collection: "Pure Attar", category: "Pure Attar", notes: [], faq: "",
      sizeOptions: [], prices: {}, price: null, status: "draft",
      image: "", description: "", featured: false, bestSeller: false,
      attar: { enabled: true, variants: {} },
      perfume: { enabled: false, variants: {} },
    });
  }

  function openEditProduct(product: any) {
    setEditingIsNew(false);
    setNewFormats({
      attar: product.attar?.enabled !== false,
      perfume: product.perfume?.enabled === true,
    });
    setEditing({ ...product });
  }

  function commit() {
    const slug = editingIsNew
      ? String(editing.name || "").trim().toLowerCase()
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : editing.slug;

    if (!editing.name?.trim() || !slug || !editing.sku?.trim()) {
      alert("Product name and base SKU are required.");
      return;
    }
    if (editingIsNew && items.some((p) => p.slug === slug)) {
      alert("A product with this name/slug already exists. Please use a different name.");
      return;
    }
    if (!newFormats.attar && !newFormats.perfume) {
      alert("Select at least one product format: Attar or Perfume.");
      return;
    }

    const prices = editing.prices || {};
    const baseSku = editing.sku.trim();
    const attarVariants: Record<string, any> = {};
    if (newFormats.attar) {
      if (prices["6 ML"] != null) attarVariants["6ML"] = { sku: editing.sku6 || `${baseSku}-06M`, price: prices["6 ML"] };
      if (prices["12 ML"] != null) attarVariants["12ML"] = { sku: editing.sku12 || `${baseSku}-12M`, price: prices["12 ML"] };
    }
    const perfumeVariants: Record<string, any> = {};
    if (newFormats.perfume) {
      if (prices["30 ML"] != null) perfumeVariants["30ML"] = { sku: editing.sku30 || `${baseSku}-30M`, price: prices["30 ML"] };
      if (prices["50 ML"] != null) perfumeVariants["50ML"] = { sku: editing.sku50 || `${baseSku}-50M`, price: prices["50 ML"] };
      if (prices["100 ML"] != null) perfumeVariants["100ML"] = { sku: editing.sku100 || `${baseSku}-100M`, price: prices["100 ML"] };
    }

    const product = {
      ...editing,
      slug,
      name: editing.name.trim(),
      sku: baseSku,
      baseSku,
      status: editing.status || "draft",
      collection: newFormats.attar && newFormats.perfume ? "Fragrance" : newFormats.attar ? "Pure Attar" : "Modern Perfume",
      category: editing.category || (newFormats.attar && newFormats.perfume ? "Fragrance" : newFormats.attar ? "Pure Attar" : "Modern Perfume"),
      notes: Array.isArray(editing.notes) ? editing.notes : [],
      price: prices["6 ML"] ?? prices["30 ML"] ?? editing.price ?? null,
      attar: { enabled: newFormats.attar, variants: attarVariants },
      perfume: { enabled: newFormats.perfume, variants: perfumeVariants },
    };

    if (editingIsNew) {
      setItems((current) => [...current, product]);
      setNewSlugs((current) => [...current, slug]);
    } else {
      setItems((current) => current.map((p) => (p.slug === slug ? product : p)));
    }
    setDirtySlugs((current) => current.includes(slug) ? current : [...current, slug]);
    setEditing(null);
    setEditingIsNew(false);
  }

  async function deleteSelectedProducts() {
    const slugs = selectedSlugs.filter((slug) => items.some((p) => p.slug === slug));
    if (!slugs.length) return;
    const names = items.filter((p) => slugs.includes(p.slug)).map((p) => p.name).join(", ");
    if (!window.confirm(`Permanently delete ${slugs.length} selected product(s)?\n\n${names}\n\nThis deletion is immediate and does not wait for Publish Changes.`)) return;

    try {
      const response = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slugs }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.message || "Unable to delete selected products.");
      setItems((current) => current.filter((p) => !slugs.includes(p.slug)));
      setDirtySlugs((current) => current.filter((slug) => !slugs.includes(slug)));
      setNewSlugs((current) => current.filter((slug) => !slugs.includes(slug)));
      setSelectedSlugs([]);
      alert(`${data.deletedCount} product(s) deleted.`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to delete products.");
    }
  }

  function addImage(e: any) {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 900;

        const scale = Math.min(
          1,
          max / Math.max(img.width, img.height)
        );

        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        canvas
          .getContext("2d")!
          .drawImage(img, 0, 0, canvas.width, canvas.height);

        update("image", canvas.toDataURL("image/jpeg", 0.82));
      };

      img.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  }

  function toggle(
    setter: any,
    list: string[],
    slug: string
  ) {
    setter(
      list.includes(slug)
        ? list.filter((x) => x !== slug)
        : [...list, slug]
    );
  }

  const filtered = useMemo(
    () =>
      items.filter((p) =>
        (p.name + " " + p.sku + " " + p.category)
          .toLowerCase()
          .includes(q.toLowerCase())
      ),
    [items, q]
  );

  if (!ok) {
    return (
      <main className="admin-login">
        <div className="admin-login-card">
          <img
            src="/images/areej-logo.png"
            alt="AREEJ"
            className="admin-login-logo"
          />

          <p className="eyebrow">Private area</p>

          <h1>AREEJ Admin</h1>

          <p>
            Authorised catalogue, discovery and ordering controls.
          </p>

          <form onSubmit={login}>
            <input
              type="text"
              placeholder="Admin username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />

            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button className="gold-button full-width">
              Sign in
            </button>
          </form>

          <small>
            Admin credentials are configured through environment
            variables.
          </small>
        </div>
      </main>
    );
  }

  const merch = (list: string[], setter: any) => (
    <div className="merch-list">
      {items.map((p) => (
        <label key={p.slug}>
          <input
            type="checkbox"
            checked={list.includes(p.slug)}
            onChange={() => toggle(setter, list, p.slug)}
          />

          <span>
            {p.name.replace(/^Areej /, "")}{" "}
            <small>{p.sku}</small>
          </span>
        </label>
      ))}
    </div>
  );

  const d = discovery[discoveryTab];

  const setD = (patch: Partial<DiscoveryConfig>) =>
    setDiscovery((prev) => ({
      ...prev,
      [discoveryTab]: {
        ...prev[discoveryTab],
        ...patch,
      },
    }));

  return (
    <main className="admin-page">
      <div className="admin-top">
        <div>
          <p className="eyebrow">AREEJ / Admin</p>
          <h1>Control room</h1>
          <p>Manage catalogue, merchandising and order rules.</p>
        </div>

        <div>
          <button
            onClick={persist}
            className="gold-button"
            disabled={productsLoading || settingsLoading || Boolean(productsError) || Boolean(settingsError)}
          >
            Save changes
          </button>{" "}
          <button
            onClick={publishChanges}
            className="outline-button"
            disabled={publishing || productsLoading || settingsLoading || Boolean(productsError) || Boolean(settingsError)}
          >
            {publishing ? "Publishing..." : "Publish Changes"}
          </button>{" "}
          <button onClick={logout} className="outline-button">
            Sign out
          </button>
        </div>
      </div>

      {settingsLoading && (
        <p className="admin-help">Loading admin settings from PostgreSQL...</p>
      )}
      {settingsError && (
        <p role="alert" className="admin-help">
          Could not load settings from PostgreSQL: {settingsError}
        </p>
      )}

      <div className="admin-tabs">
        <button
          className={tab === "products" ? "selected" : ""}
          onClick={() => setTab("products")}
        >
          Products
        </button>

        <button
          className={tab === "signatures" ? "selected" : ""}
          onClick={() => setTab("signatures")}
        >
          Explore the Signatures
        </button>

        <button
          className={tab === "bestsellers" ? "selected" : ""}
          onClick={() => setTab("bestsellers")}
        >
          Best Sellers
        </button>

        <button
          className={tab === "finder" ? "selected" : ""}
          onClick={() => setTab("finder")}
        >
          Find Your Fragrance
        </button>

        <button
          className={tab === "discovery" ? "selected" : ""}
          onClick={() => setTab("discovery")}
        >
          Discovery Sets
        </button>

        <button
          className={tab === "orders" ? "selected" : ""}
          onClick={() => setTab("orders")}
        >
          Order Rules
        </button>
      </div>

      {tab === "products" && (
        <>
          <div className="admin-toolbar">
            <button className="gold-button" onClick={openNewProduct}>+ Add product</button>
            <button className="outline-button" onClick={deleteSelectedProducts} disabled={!selectedSlugs.length || productsLoading}>
              Delete selected ({selectedSlugs.length})
            </button>
            <input
              placeholder="Search catalogue..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <span>
              {productsLoading
                ? "Loading products..."
                : `${items.length} products${dirtySlugs.length ? ` · ${dirtySlugs.length} unsaved` : ""}`}
            </span>
          </div>

          {productsError && (
            <p role="alert" className="admin-help">
              Could not load products from PostgreSQL: {productsError}
            </p>
          )}

          <div className="admin-table">
            <div className="admin-row">
              <label><input type="checkbox" checked={filtered.length > 0 && filtered.every((p) => selectedSlugs.includes(p.slug))} onChange={(e) => setSelectedSlugs((current) => e.target.checked ? Array.from(new Set([...current, ...filtered.map((p) => p.slug)])) : current.filter((slug) => !filtered.some((p) => p.slug === slug)))} /> Select all visible</label>
              <small>{selectedSlugs.length} selected</small>
            </div>
            {filtered.map((p) => (
              <div className="admin-row" key={p.slug}>
                <label><input type="checkbox" checked={selectedSlugs.includes(p.slug)} onChange={(e) => setSelectedSlugs((current) => e.target.checked ? [...current, p.slug] : current.filter((slug) => slug !== p.slug))} /></label>
                <div>
                  <strong>{p.name.replace(/^Areej /, "")}</strong>
                  <small>
                    {p.sku} · {p.collection}
                  </small>
                </div>

                <div>
                  From ₹{getMinPrice(p.prices, p.price)}
                </div>

                <button onClick={() => openEditProduct(p)}>
                  Edit
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "signatures" && (
        <div className="merch-grid">
          <div>
            <h2>Explore the Signatures</h2>
            <p>
              Select which products appear in the homepage signature
              collection. The first 6 selected are displayed.
            </p>
          </div>

          {merch(featured, setFeatured)}
        </div>
      )}

      {tab === "bestsellers" && (
        <div className="merch-grid">
          <div>
            <h2>Best Sellers</h2>
            <p>
              Select which products appear in the homepage best-seller
              section. The first 4 selected are displayed.
            </p>
          </div>

          {merch(best, setBest)}
        </div>
      )}

      {tab === "finder" && (
        <div className="merch-grid">
          <div>
            <h2>Explore First</h2>
            <p>
              Select the products that the fragrance finder should
              prioritise.
            </p>
          </div>

          {merch(finder, setFinder)}
        </div>
      )}

      {tab === "discovery" && (
        <div className="settings-card">
          <h2>Discovery Sets</h2>

          <p>
            Customers can build either a set of 3 or 5 different
            fragrances. Each collection has its own trial sizes and
            both are priced automatically from each product's 30 ML
            catalogue price.
          </p>

          <div className="admin-tabs discovery-admin-tabs">
            <button
              className={discoveryTab === "attar" ? "selected" : ""}
              onClick={() => setDiscoveryTab("attar")}
            >
              Attar Discovery
            </button>

            <button
              className={discoveryTab === "perfume" ? "selected" : ""}
              onClick={() => setDiscoveryTab("perfume")}
            >
              Perfume Discovery
            </button>
          </div>

          <label className="switch-line">
            <input
              type="checkbox"
              checked={d.enabled}
              onChange={(e) => setD({ enabled: e.target.checked })}
            />
            Enable {discoveryTab} discovery
          </label>

          <h3>Set sizes</h3>

          <div className="choice-row">
            {[3, 5].map((n) => (
              <button
                key={n}
                className={d.options.includes(n) ? "selected" : ""}
                onClick={() =>
                  setD({
                    options: d.options.includes(n)
                      ? d.options.filter((x) => x !== n)
                      : [...d.options, n].sort(),
                  })
                }
              >
                {n} products
              </button>
            ))}
          </div>

          <h3>Allowed trial sizes</h3>

          <div className="choice-row">
            {d.sizes.map((s) => (
              <button
                key={s}
                className="selected"
                onClick={() =>
                  setD({
                    sizes: d.sizes.filter((x) => x !== s),
                  })
                }
              >
                {s} ×
              </button>
            ))}

            <button
              onClick={() => {
                const next =
                  discoveryTab === "attar"
                    ? ["3 ML", "6 ML", "9 ML"]
                    : ["5 ML", "10 ML", "15 ML"];

                setD({
                  sizes: Array.from(
                    new Set([
                      ...d.sizes,
                      next.find((x) => !d.sizes.includes(x))!,
                    ])
                  ),
                });
              }}
            >
              + Add size
            </button>
          </div>

          <div className="admin-help">
            <strong>Automatic discovery pricing:</strong> 30 ML price
            ÷ 30 × selected trial ML, then rounded up to the next
            rupee. Example: a ₹350 / 30 ML product is ₹35 for 3 ML
            and ₹70 for 6 ML. No separate discovery price table is
            required.
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="settings-card">
          <h2>Order & Delivery Rules</h2>

          <div className="settings-grid">
            <label className="switch-line">
              <input
                type="checkbox"
                checked={orderSettings.minOrderEnabled}
                onChange={(e) =>
                  setOrderSettings({
                    ...orderSettings,
                    minOrderEnabled: e.target.checked,
                  })
                }
              />
              Enable minimum order
            </label>

            <label>
              Minimum order value
              <input
                type="number"
                value={orderSettings.minOrderValue}
                onChange={(e) =>
                  setOrderSettings({
                    ...orderSettings,
                    minOrderValue: Number(e.target.value),
                  })
                }
              />
            </label>

            <label>
              Free delivery from
              <input
                type="number"
                value={orderSettings.freeDeliveryThreshold}
                onChange={(e) =>
                  setOrderSettings({
                    ...orderSettings,
                    freeDeliveryThreshold: Number(e.target.value),
                  })
                }
              />
            </label>

            <label>
              Delivery charge below threshold
              <input
                type="number"
                value={orderSettings.deliveryCharge}
                onChange={(e) =>
                  setOrderSettings({
                    ...orderSettings,
                    deliveryCharge: Number(e.target.value),
                  })
                }
              />
            </label>

            <label className="switch-line">
              <input
                type="checkbox"
                checked={orderSettings.trial3mlEnabled}
                onChange={(e) =>
                  setOrderSettings({
                    ...orderSettings,
                    trial3mlEnabled: e.target.checked,
                  })
                }
              />
              Show 3 ML trial suggestions on order page
            </label>

            <label>
              3 ML trial price per bottle
              <input
                type="number"
                value={orderSettings.trial3mlPrice ?? ""}
                onChange={(e) =>
                  setOrderSettings({
                    ...orderSettings,
                    trial3mlPrice:
                      e.target.value === ""
                        ? null
                        : Number(e.target.value),
                  })
                }
                placeholder="Set price"
              />
            </label>
          </div>

          <div className="admin-help">
            <strong>Current customer rule:</strong>{" "}
            {orderSettings.minOrderEnabled
              ? `Minimum ₹${orderSettings.minOrderValue}; `
              : "No minimum order; "}
            free delivery at ₹{orderSettings.freeDeliveryThreshold}+
            and ₹{orderSettings.deliveryCharge} delivery below that.
          </div>
        </div>
      )}

      {editing && typeof document !== "undefined" && createPortal(
        <div className="modal admin-editor-modal">
          <div className="modal-card admin-editor">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Catalogue editor</p>
                <h2>{editingIsNew ? "Add product" : "Edit product"}</h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setEditing(null)}
              >
                ×
              </button>
            </div>

            <label>
              Product name
              <input
                value={editing.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </label>

            <div className="choice-row">
              <label><input type="checkbox" checked={newFormats.attar} onChange={(e) => setNewFormats((v) => ({ ...v, attar: e.target.checked }))} /> Attar</label>
              <label><input type="checkbox" checked={newFormats.perfume} onChange={(e) => setNewFormats((v) => ({ ...v, perfume: e.target.checked }))} /> Perfume</label>
            </div>

            <label>
              Base SKU / product numbering
              <input
                value={editing.sku}
                onChange={(e) => update("sku", e.target.value)}
              />
            </label>

            {newFormats.attar && (
              <section className="admin-format-section">
                <h3>Attar sizes & prices</h3>
                <div className="sku-grid">
                  <label>6 ML SKU<input value={editing.sku6 || ""} onChange={(e) => update("sku6", e.target.value)} /></label>
                  <label>12 ML SKU<input value={editing.sku12 || ""} onChange={(e) => update("sku12", e.target.value)} /></label>
                  {["6 ML", "12 ML"].map((size) => (
                    <label key={size}>{size} price<input type="number" min="0" value={editing.prices?.[size] ?? editing.attar?.variants?.[size.replace(" ", "")]?.price ?? ""} onChange={(e) => updateSize(size, e.target.value)} placeholder="N/A" /></label>
                  ))}
                </div>
              </section>
            )}

            {newFormats.perfume && (
              <section className="admin-format-section">
                <h3>Modern Perfume sizes & prices</h3>
                <div className="sku-grid">
                  <label>30 ML SKU<input value={editing.sku30 || editing.perfume?.variants?.["30ML"]?.sku || ""} onChange={(e) => update("sku30", e.target.value)} /></label>
                  <label>50 ML SKU<input value={editing.sku50 || editing.perfume?.variants?.["50ML"]?.sku || ""} onChange={(e) => update("sku50", e.target.value)} /></label>
                  <label>100 ML SKU<input value={editing.sku100 || editing.perfume?.variants?.["100ML"]?.sku || ""} onChange={(e) => update("sku100", e.target.value)} /></label>
                  {["30 ML", "50 ML", "100 ML"].map((size) => (
                    <label key={size}>{size} price<input type="number" min="0" value={editing.prices?.[size] ?? editing.perfume?.variants?.[size.replace(" ", "")]?.price ?? ""} onChange={(e) => updateSize(size, e.target.value)} placeholder="N/A" /></label>
                  ))}
                </div>
              </section>
            )}

            <label>
              Replace product image
              <input
                type="file"
                accept="image/*"
                onChange={addImage}
              />
            </label>

            {editing.image && (
              <img
                className="admin-preview"
                src={editing.image}
                alt="Preview"
              />
            )}

            <label>
              Image URL (optional)
              <input
                value={
                  editing.image?.startsWith("data:")
                    ? ""
                    : editing.image
                }
                onChange={(e) => update("image", e.target.value)}
              />
            </label>

            <label>
              Status
              <select
                value={editing.status}
                onChange={(e) => update("status", e.target.value)}
              >
                <option>published</option>
                <option>draft</option>
              </select>
            </label>

            <label>
              Collection
              <input value={editing.collection ?? ""} onChange={(e) => update("collection", e.target.value)} placeholder="e.g. Pure Attar / Modern Perfume" />
            </label>

            <label>
              Category
              <input value={editing.category ?? ""} onChange={(e) => update("category", e.target.value)} placeholder="Fragrance category" />
            </label>

            <label>
              Fragrance notes (comma separated)
              <input value={(editing.notes || []).join(", ")} onChange={(e) => update("notes", e.target.value.split(",").map((x: string) => x.trim()).filter(Boolean))} placeholder="e.g. Rose, Oud, Amber" />
            </label>

            <label>
              Fragrance description
              <textarea
                value={editing.description ?? ""}
                onChange={(e) => update("description", e.target.value)}
              />
            </label>

            <div className="editor-actions">
              <button
                className="gold-button"
                onClick={commit}
              >
                {editingIsNew ? "Create Product" : "Update Product"}
              </button>

              <button
                className="outline-button"
                onClick={() => { setEditing(null); setEditingIsNew(false); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}