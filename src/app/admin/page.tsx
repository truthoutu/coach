"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Plus,
  Trash2,
  Upload,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  DollarSign,
  Menu,
  X,
  Eye,
  Image as ImageIcon,
  Pencil,
  LogOut,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  compareAtPrice: number | null;
  image: string;
  images?: string[];
  category: string;
  subcategory: string | null;
  gender: string;
  collection: string | null;
  inventory: number;
  sku: string | null;
  isNew: boolean;
  isFeatured?: boolean;
  status?: string;
  description?: string | null;
}

interface Campaign {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link: string;
  isFeatured: boolean;
  displayOrder: number;
}

interface OrderItem {
  id: string;
  name: string;
  sku?: string | null;
  quantity: number;
  priceLabel?: string;
}

interface Order {
  id: string;
  number: string;
  customerName: string;
  email: string;
  phone?: string | null;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  total: number;
  status: string;
  paymentMethod: string;
  notes?: string | null;
  paymentImage?: string | null;
  paymentNote?: string | null;
  customerPaidAt?: string | null;
  createdAt: string;
  items: OrderItem[];
}

type ProductForm = {
  name: string;
  price: string;
  compareAtPrice: string;
  images: string[];
  category: string;
  subcategory: string;
  gender: string;
  collection: string;
  sku: string;
  inventory: string;
  isNew: boolean;
  isFeatured: boolean;
  status: "ACTIVE" | "HIDDEN";
  description: string;
};

const CATEGORIES = ["Bags", "Shoes", "Wallets", "Accessories", "Small Leather Goods", "Ready-To-Wear"];
const ORDER_STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const emptyProductForm = (): ProductForm => ({
  name: "",
  price: "",
  compareAtPrice: "",
  images: [],
  category: "Bags",
  subcategory: "",
  gender: "Women",
  collection: "",
  sku: "",
  inventory: "1",
  isNew: true,
  isFeatured: false,
  status: "ACTIVE",
  description: "",
});

function money(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}

function statusTone(status: string): string {
  if (status === "DELIVERED" || status === "CONFIRMED") return "bg-emerald-100 text-emerald-800";
  if (status === "SHIPPED" || status === "PROCESSING") return "bg-sky-100 text-sky-800";
  if (status === "CANCELLED") return "bg-rose-100 text-rose-800";
  return "bg-amber-100 text-amber-800";
}

export default function AdminPage() {
  const [activeNav, setActiveNav] = useState<"overview" | "products" | "campaigns" | "orders">("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [products, setProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    title: "",
    subtitle: "",
    image: "",
    link: "",
    isFeatured: false,
    displayOrder: 1,
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [payNote, setPayNote] = useState<Record<string, string>>({});
  const seenPayRef = React.useRef<Set<string>>(new Set());
  const [payAlert, setPayAlert] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCampaigns();
    fetchOrders();
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    const t = setInterval(() => fetchOrders(true), 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const hot = orders.filter((o) => o.status === "PENDING_PAYMENT");
    for (const o of hot) {
      const key = `${o.id}:${o.paymentImage || ""}:${o.customerPaidAt || ""}`;
      if (seenPayRef.current.has(key)) continue;
      seenPayRef.current.add(key);
      const needsDetails = !o.paymentImage && !o.paymentNote;
      const needsConfirm = Boolean(o.customerPaidAt);
      if (!needsDetails && !needsConfirm) continue;
      const msg = needsConfirm
        ? `${o.customerName} says they paid ${o.number} via ${o.paymentMethod}`
        : `${o.customerName} wants to pay ${o.number} with ${o.paymentMethod}`;
      setPayAlert(msg);
      setActiveNav("orders");
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = needsConfirm ? 880 : 520;
        gain.gain.value = 0.08;
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch { /* ignore */ }
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("COACH payment", { body: msg, requireInteraction: true });
      }
      const prev = document.title;
      let n = 0;
      const blink = setInterval(() => {
        document.title = n % 2 === 0 ? "PAYMENT — COACH" : prev;
        if (++n > 12) {
          clearInterval(blink);
          document.title = prev;
        }
      }, 600);
    }
  }, [orders]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchProducts() {
    setProductLoading(true);
    try {
      const res = await fetch("/api/products?scope=admin");
      if (res.ok) setProducts(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setProductLoading(false);
    }
  }

  async function fetchCampaigns() {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) setCampaigns(await res.json());
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchOrders(silent = false) {
    if (!silent) setOrdersLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setOrdersLoading(false);
    }
  }

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "product" | "campaign",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        if (target === "product") {
          setProductForm((prev) => ({ ...prev, images: [...prev.images, data.url] }));
        } else {
          setCampaignForm((prev) => ({ ...prev, image: data.url }));
        }
        setToast({ text: "Photo uploaded.", type: "success" });
      } else {
        setToast({ text: data.error || "Failed to upload photo", type: "error" });
      }
    } catch {
      setToast({ text: "Error uploading image", type: "error" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  function openAddModal() {
    setEditingId(null);
    setProductForm(emptyProductForm());
    setModalOpen(true);
  }

  function openEditModal(p: Product) {
    setEditingId(p.id);
    setProductForm({
      name: p.name,
      price: String(p.price ?? ""),
      compareAtPrice: p.compareAtPrice != null ? String(p.compareAtPrice) : "",
      images: p.images?.length ? p.images : p.image ? [p.image] : [],
      category: p.category || "Bags",
      subcategory: p.subcategory || "",
      gender: p.gender || "Women",
      collection: p.collection || "",
      sku: p.sku || "",
      inventory: String(p.inventory ?? 0),
      isNew: Boolean(p.isNew),
      isFeatured: Boolean(p.isFeatured),
      status: p.status === "HIDDEN" ? "HIDDEN" : "ACTIVE",
      description: p.description || "",
    });
    setModalOpen(true);
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || productForm.images.length === 0) {
      setToast({ text: "Add a title, price, and at least one photo.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: editingId || undefined,
        name: productForm.name,
        price: productForm.price,
        compareAtPrice: productForm.compareAtPrice || "",
        image: productForm.images[0],
        images: productForm.images,
        category: productForm.category,
        subcategory: productForm.subcategory || undefined,
        gender: productForm.gender,
        collection: productForm.collection || undefined,
        sku: productForm.sku,
        inventory: productForm.inventory,
        isNew: productForm.isNew,
        isFeatured: productForm.isFeatured,
        status: productForm.status,
        description: productForm.description,
      };
      const res = await fetch("/api/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setToast({ text: editingId ? "Product updated." : "Product added.", type: "success" });
        setModalOpen(false);
        setEditingId(null);
        setProductForm(emptyProductForm());
        fetchProducts();
      } else {
        const data = await res.json();
        setToast({ text: data.error || "Could not save product", type: "error" });
      }
    } catch {
      setToast({ text: "Server error saving product", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Remove this product from the catalog?")) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setToast({ text: "Product removed.", type: "success" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.title || !campaignForm.image) {
      setToast({ text: "Add a banner title and photo.", type: "error" });
      return;
    }
    try {
      const res = await fetch("/api/campaigns", {
        method: editingCampaignId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingCampaignId || undefined, ...campaignForm }),
      });
      if (res.ok) {
        setToast({ text: editingCampaignId ? "Banner updated." : "Homepage picture saved.", type: "success" });
        setCampaignForm({ title: "", subtitle: "", image: "", link: "", isFeatured: false, displayOrder: 1 });
        setEditingCampaignId(null);
        fetchCampaigns();
      } else {
        const data = await res.json();
        setToast({ text: data.error || "Failed to save banner", type: "error" });
      }
    } catch {
      setToast({ text: "Server error saving banner", type: "error" });
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Remove this homepage picture?")) return;
    try {
      const res = await fetch(`/api/campaigns?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        if (editingCampaignId === id) {
          setEditingCampaignId(null);
          setCampaignForm({ title: "", subtitle: "", image: "", link: "", isFeatured: false, displayOrder: 1 });
        }
        setToast({ text: "Homepage picture removed.", type: "success" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrderStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...data.order } : o)));
        setToast({ text: `Order marked ${status.replace(/_/g, " ").toLowerCase()}.`, type: "success" });
        fetchProducts();
      } else {
        setToast({ text: data.error || "Could not update order", type: "error" });
      }
    } catch {
      setToast({ text: "Server error updating order", type: "error" });
    }
  };

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q);
      const matchesCategory = selectedCategory === "All" || p.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const totalSales = orders.reduce((sum, o) => sum + money(o.total), 0);
  const lowStock = products.filter((p) => (p.inventory ?? 0) <= 3 && p.status !== "HIDDEN").length;

  const navBtn = (id: typeof activeNav, label: string, icon: React.ReactNode, count?: number) => (
    <button
      onClick={() => {
        setActiveNav(id);
        setMobileSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer justify-between ${
        activeNav === id ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon} {label}
      </div>
      {typeof count === "number" ? (
        <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-full">{count}</span>
      ) : null}
    </button>
  );

  const sidebar = (mobile = false) => (
    <div className={`${mobile ? "w-64 h-full" : "hidden lg:flex w-64 flex-shrink-0"} bg-slate-900 text-white flex flex-col justify-between p-6 border-r border-slate-800`}>
      <div className="space-y-8">
        <div className="border-b border-slate-800 pb-6 flex items-start justify-between gap-3">
          <div>
            <Link href="/" className="font-serif text-2xl font-bold uppercase tracking-widest text-white block">
              COACH
            </Link>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mt-1">
              Store Manager
            </span>
          </div>
          {mobile ? (
            <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          ) : null}
        </div>
        <nav className="space-y-1.5">
          {navBtn("overview", "Overview", <LayoutDashboard size={18} />)}
          {navBtn("products", "Products", <ShoppingBag size={18} />, products.length)}
          {navBtn("campaigns", "Homepage Pictures", <ImageIcon size={18} />, campaigns.length)}
          {navBtn("orders", "Orders & Sales", <Package size={18} />, orders.length)}
        </nav>
      </div>
      <div className="border-t border-slate-800 pt-6 space-y-4">
        <Link href="/" target="_blank" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white font-semibold uppercase tracking-wider">
          <ExternalLink size={14} /> View Storefront
        </Link>
        <button onClick={logout} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white font-semibold uppercase tracking-wider cursor-pointer">
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans flex">
      {sidebar(false)}
      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 bg-black/60 lg:hidden flex">{sidebar(true)}</div>
      ) : null}

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 hover:text-black">
              <Menu size={20} />
            </button>
            <h1 className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-wider text-gray-900">
              {activeNav === "overview" && "Dashboard Overview"}
              {activeNav === "products" && "Product Catalog"}
              {activeNav === "campaigns" && "Homepage Banners"}
              {activeNav === "orders" && "Orders"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {activeNav === "products" && (
              <button
                onClick={openAddModal}
                className="bg-black hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} /> Add Product
              </button>
            )}
            <Link href="/" className="hidden sm:flex items-center gap-1.5 text-xs text-gray-600 hover:text-black font-semibold uppercase tracking-wider">
              <Eye size={14} /> Storefront
            </Link>
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
          {toast && (
            <div
              className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm ${
                toast.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                  : "bg-rose-50 text-rose-900 border border-rose-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className={toast.type === "success" ? "text-emerald-600" : "text-rose-600"} />
                <span>{toast.text}</span>
              </div>
              <button onClick={() => setToast(null)} className="text-xs font-bold uppercase cursor-pointer">
                Dismiss
              </button>
            </div>
          )}

          {activeNav === "overview" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-gray-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
                    <DollarSign size={18} className="text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold font-mono">${totalSales.toFixed(2)}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-gray-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Products</span>
                    <ShoppingBag size={18} />
                  </div>
                  <h3 className="text-2xl font-bold font-mono">{products.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-gray-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Orders</span>
                    <Package size={18} />
                  </div>
                  <h3 className="text-2xl font-bold font-mono">{orders.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-gray-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Low stock</span>
                  </div>
                  <h3 className="text-2xl font-bold font-mono">{lowStock}</h3>
                  <p className="text-[11px] text-gray-500">3 or fewer bags left</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="font-serif text-lg font-bold">Recent orders</h2>
                    <p className="text-xs text-gray-500">Latest checkout activity</p>
                  </div>
                  <button onClick={() => setActiveNav("orders")} className="text-xs font-semibold uppercase tracking-wider hover:underline">
                    View all →
                  </button>
                </div>
                {orders.length === 0 ? (
                  <div className="py-16 text-center text-gray-500 font-serif text-sm">No orders yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b">
                        <tr>
                          <th className="px-6 py-3">Order</th>
                          <th className="px-6 py-3">Customer</th>
                          <th className="px-6 py-3">Total</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {orders.slice(0, 8).map((ord) => (
                          <tr key={ord.id}>
                            <td className="px-6 py-4 font-mono font-bold">{ord.number}</td>
                            <td className="px-6 py-4">{ord.customerName}</td>
                            <td className="px-6 py-4 font-mono">${money(ord.total).toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusTone(ord.status)}`}>
                                {ord.status.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500 font-mono">{new Date(ord.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeNav === "products" && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search name, category, or style number…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                  {["All", ...CATEGORIES].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer ${
                        selectedCategory === cat ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="font-serif text-lg font-bold">Catalog ({filteredProducts.length})</h2>
                  <button onClick={fetchProducts} className="text-xs font-mono font-semibold text-gray-600 hover:text-black flex items-center gap-1.5 cursor-pointer">
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
                {productLoading ? (
                  <div className="py-16 text-center text-gray-400 font-mono text-xs">Loading catalog…</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-16 text-center text-gray-500 text-xs">
                    No products found. Click <span className="font-bold text-black">+ Add Product</span>.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b">
                        <tr>
                          <th className="px-6 py-3">Product</th>
                          <th className="px-6 py-3">Style no.</th>
                          <th className="px-6 py-3">Category</th>
                          <th className="px-6 py-3">Price</th>
                          <th className="px-6 py-3">Bags in stock</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredProducts.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                  {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : null}
                                </div>
                                <div>
                                  <span className="font-semibold text-sm text-gray-900 block">{item.name}</span>
                                  {item.isNew ? <span className="text-[10px] uppercase tracking-wider text-gray-500">New</span> : null}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono">{item.sku || "—"}</td>
                            <td className="px-6 py-4">
                              <span className="bg-gray-100 text-gray-800 text-[10px] font-bold uppercase px-2.5 py-1 rounded">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold">{item.priceLabel}</td>
                            <td className="px-6 py-4">
                              <span className={`font-mono font-semibold ${item.inventory <= 0 ? "text-rose-600" : item.inventory <= 3 ? "text-amber-700" : ""}`}>
                                {item.inventory}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[10px] uppercase font-bold tracking-wider">
                              {item.status === "HIDDEN" ? "Hidden" : "Live"}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-3">
                                <button onClick={() => openEditModal(item)} className="text-xs font-semibold text-gray-700 hover:text-black flex items-center gap-1 cursor-pointer">
                                  <Pencil size={14} /> Edit
                                </button>
                                <button onClick={() => handleDeleteProduct(item.id)} className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer">
                                  <Trash2 size={14} /> Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeNav === "campaigns" && (
            <div className="space-y-8">
              <div className="bg-slate-900 text-white p-6 rounded-xl">
                <h3 className="font-serif text-lg font-bold">Homepage pictures</h3>
                <p className="text-xs text-slate-300 mt-1">
                  These are the large promotional images on the storefront. Add a destination link such as /category/women-bags.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h2 className="font-serif text-lg font-bold border-b border-gray-200 pb-3 mb-4">
                    {editingCampaignId ? "Edit banner" : "Add homepage banner"}
                  </h2>
                  <form onSubmit={handleSaveCampaign} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Banner title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Shoulder Bags"
                        value={campaignForm.title}
                        onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Subtitle</label>
                      <input
                        type="text"
                        placeholder="Discover the new collection"
                        value={campaignForm.subtitle}
                        onChange={(e) => setCampaignForm({ ...campaignForm, subtitle: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Destination link</label>
                      <input
                        type="text"
                        placeholder="/category/women-bags"
                        value={campaignForm.link}
                        onChange={(e) => setCampaignForm({ ...campaignForm, link: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Display order</label>
                        <input
                          type="number"
                          min="0"
                          value={campaignForm.displayOrder}
                          onChange={(e) => setCampaignForm({ ...campaignForm, displayOrder: Number(e.target.value) || 0 })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black font-mono"
                        />
                      </div>
                      <label className="flex items-center gap-2 mt-6 text-xs font-bold uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={campaignForm.isFeatured}
                          onChange={(e) => setCampaignForm({ ...campaignForm, isFeatured: e.target.checked })}
                          className="accent-black"
                        />
                        Featured
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Banner photo *</label>
                      <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 p-4 rounded-xl text-center flex flex-col items-center gap-1.5">
                        <Upload size={20} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {uploading ? "Uploading…" : "Choose image"}
                        </span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "campaign")} className="hidden" />
                      </label>
                      {campaignForm.image ? (
                        <div className="mt-3 aspect-video w-full rounded-lg overflow-hidden border">
                          <img src={campaignForm.image} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-black text-white py-3.5 text-xs font-bold uppercase tracking-widest rounded-lg cursor-pointer">
                        {editingCampaignId ? "Save changes" : "Save banner"}
                      </button>
                      {editingCampaignId ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCampaignId(null);
                            setCampaignForm({ title: "", subtitle: "", image: "", link: "", isFeatured: false, displayOrder: 1 });
                          }}
                          className="px-4 text-xs font-bold uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </form>
                </div>
                <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h2 className="font-serif text-lg font-bold border-b pb-3">Active banners</h2>
                  {campaigns.length === 0 ? (
                    <p className="text-xs text-gray-500 py-8 text-center">No banners yet.</p>
                  ) : (
                    campaigns.map((c) => (
                      <div key={c.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
                        <div className="w-24 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif font-bold">{c.title}</h3>
                          {c.subtitle ? <p className="text-xs text-gray-500">{c.subtitle}</p> : null}
                          <p className="text-[10px] font-mono text-gray-500 truncate">{c.link || "No link"}</p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingCampaignId(c.id);
                            setCampaignForm({
                              title: c.title,
                              subtitle: c.subtitle || "",
                              image: c.image,
                              link: c.link === "#" ? "" : c.link,
                              isFeatured: c.isFeatured,
                              displayOrder: c.displayOrder,
                            });
                          }}
                          className="text-xs font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDeleteCampaign(c.id)} className="text-rose-600 cursor-pointer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeNav === "orders" && (
            <div className="space-y-6">
              {payAlert ? (
                <div className="bg-rose-600 text-white p-4 rounded-xl flex items-center justify-between gap-4">
                  <p className="text-sm font-bold uppercase tracking-wider">{payAlert}</p>
                  <button onClick={() => setPayAlert(null)} className="text-xs font-bold">Dismiss</button>
                </div>
              ) : null}
              {orders.filter((o) => o.status === "PENDING_PAYMENT").length > 0 && (
                <div className="bg-black text-white p-6 rounded-xl space-y-4">
                  <h2 className="font-serif text-xl font-bold">Live payments — act now</h2>
                  {orders.filter((o) => o.status === "PENDING_PAYMENT").map((o) => (
                    <div
                      key={o.id}
                      className="bg-white text-gray-900 rounded-xl p-4 space-y-3"
                      onPaste={async (e) => {
                        const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
                        if (!file) return;
                        e.preventDefault();
                        setUploading(true);
                        const fd = new FormData();
                        fd.append("file", file);
                        const up = await fetch("/api/upload", { method: "POST", body: fd });
                        const data = await up.json();
                        setUploading(false);
                        if (data.url) {
                          await fetch("/api/orders", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: o.id, paymentImage: data.url, paymentNote: payNote[o.id] ?? o.paymentNote ?? "" }),
                          });
                          fetchOrders(true);
                          setToast({ text: "Payment details sent to customer.", type: "success" });
                        }
                      }}
                    >
                      <div className="flex justify-between gap-3 text-sm">
                        <div>
                          <p className="font-mono font-bold">{o.number}</p>
                          <p>{o.customerName} · {o.email}</p>
                          <p className="text-xs uppercase tracking-wider font-bold mt-1">{o.paymentMethod} · ${money(o.total).toFixed(2)}</p>
                        </div>
                        <p className="text-xs font-bold text-rose-600">
                          {o.customerPaidAt ? "CUSTOMER WAITING ON YOUR CONFIRM" : o.paymentImage ? "Waiting for customer to pay" : "SEND QR / DETAILS"}
                        </p>
                      </div>
                      <textarea
                        placeholder="Optional note: Cash App $name, Zelle email, BTC address…"
                        value={payNote[o.id] ?? o.paymentNote ?? ""}
                        onChange={(e) => setPayNote((p) => ({ ...p, [o.id]: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg text-sm p-2"
                        rows={2}
                      />
                      <div className="flex flex-wrap gap-2 items-center">
                        <label className="text-xs font-bold uppercase tracking-wider border border-gray-300 px-3 py-2 rounded-lg cursor-pointer">
                          {uploading ? "Uploading…" : "Upload or paste QR"}
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploading(true);
                            const fd = new FormData();
                            fd.append("file", file);
                            const up = await fetch("/api/upload", { method: "POST", body: fd });
                            const data = await up.json();
                            setUploading(false);
                            if (data.url) {
                              await fetch("/api/orders", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: o.id, paymentImage: data.url, paymentNote: payNote[o.id] ?? o.paymentNote ?? "" }),
                              });
                              fetchOrders(true);
                              setToast({ text: "Payment details sent to customer.", type: "success" });
                            }
                          }} />
                        </label>
                        <button
                          className="text-xs font-bold uppercase tracking-wider bg-black text-white px-3 py-2 rounded-lg"
                          onClick={async () => {
                            await fetch("/api/orders", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: o.id, paymentNote: payNote[o.id] ?? "" }),
                            });
                            fetchOrders(true);
                          }}
                        >
                          Send note
                        </button>
                        {o.customerPaidAt ? (
                          <button
                            className="text-xs font-bold uppercase tracking-wider bg-emerald-700 text-white px-3 py-2 rounded-lg"
                            onClick={() => handleOrderStatus(o.id, "CONFIRMED")}
                          >
                            Confirm payment received
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold">Customer orders</h2>
                <button onClick={fetchOrders} className="text-xs font-mono font-semibold text-gray-600 hover:text-black flex items-center gap-1.5 cursor-pointer">
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
              {ordersLoading ? (
                <div className="py-16 text-center text-gray-400 font-mono text-xs">Loading orders…</div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center text-gray-500 font-serif text-sm">No orders yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b">
                      <tr>
                        <th className="px-4 py-3">Order</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Items</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Payment</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {orders.map((ord) => (
                        <React.Fragment key={ord.id}>
                          <tr className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setOpenOrderId(openOrderId === ord.id ? null : ord.id)}>
                            <td className="px-4 py-4 font-mono font-bold">{ord.number}</td>
                            <td className="px-4 py-4">
                              <div className="font-medium">{ord.customerName}</div>
                              <div className="text-gray-500">{ord.email}</div>
                            </td>
                            <td className="px-4 py-4 text-gray-700">
                              {ord.items.map((it) => (
                                <span key={it.id} className="block">
                                  {it.name} ×{it.quantity}
                                </span>
                              ))}
                            </td>
                            <td className="px-4 py-4 font-mono font-bold">${money(ord.total).toFixed(2)}</td>
                            <td className="px-4 py-4 font-mono text-gray-600">{ord.paymentMethod}</td>
                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={ord.status}
                                onChange={(e) => handleOrderStatus(ord.id, e.target.value)}
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border-0 cursor-pointer ${statusTone(ord.status)}`}
                              >
                                {ORDER_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s.replace(/_/g, " ")}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-4 font-mono text-gray-500">{new Date(ord.createdAt).toLocaleString()}</td>
                          </tr>
                          {openOrderId === ord.id ? (
                            <tr className="bg-slate-50">
                              <td colSpan={7} className="px-6 py-4 text-xs text-gray-700">
                                <div className="grid sm:grid-cols-2 gap-4">
                                  <div>
                                    <p className="font-bold uppercase tracking-wider text-[10px] text-gray-500 mb-1">Ship to</p>
                                    <p>{ord.address}</p>
                                    <p>
                                      {ord.city} {ord.postalCode}
                                    </p>
                                    <p>{ord.country}</p>
                                    {ord.phone ? <p className="mt-1">Tel {ord.phone}</p> : null}
                                  </div>
                                  <div>
                                    <p className="font-bold uppercase tracking-wider text-[10px] text-gray-500 mb-1">Notes</p>
                                    <p>{ord.notes || "—"}</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            </div>
          )}
        </main>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black cursor-pointer p-1">
              <X size={20} />
            </button>
            <div>
              <h2 className="font-serif text-xl font-bold">{editingId ? "Edit product" : "Add new product"}</h2>
              <p className="text-xs text-gray-500">Style number and bag count are required for a clean catalog.</p>
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Product title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Soft Tabby Hobo 26"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Style number / SKU</label>
                  <input
                    type="text"
                    placeholder="C0142-BK-U26"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Number of bags in stock *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={productForm.inventory}
                    onChange={(e) => setProductForm({ ...productForm, inventory: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Price (USD) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="495.00"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Compare-at price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="550.00"
                    value={productForm.compareAtPrice}
                    onChange={(e) => setProductForm({ ...productForm, compareAtPrice: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Gender</label>
                  <select
                    value={productForm.gender}
                    onChange={(e) => setProductForm({ ...productForm, gender: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="Women">Women</option>
                    <option value="Men">Men</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Subcategory</label>
                  <input
                    type="text"
                    placeholder="Shoulder Bags"
                    value={productForm.subcategory}
                    onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Collection</label>
                  <input
                    type="text"
                    placeholder="Tabby"
                    value={productForm.collection}
                    onChange={(e) => setProductForm({ ...productForm, collection: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-gray-800 mb-1.5">Product photos *</label>
                <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 p-6 rounded-xl text-center flex flex-col items-center gap-2">
                  <Upload size={22} />
                  <span className="text-xs font-bold uppercase tracking-wider">{uploading ? "Uploading…" : "Add photo from device"}</span>
                  <span className="text-[11px] text-gray-500">You can add more than one</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "product")} className="hidden" />
                </label>
                {productForm.images.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {productForm.images.map((url, i) => (
                      <div key={url + i} className="relative w-16 h-20 rounded-lg overflow-hidden border">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setProductForm((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                          className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full w-5 h-5 text-[10px]"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold cursor-pointer">
                  <input type="checkbox" checked={productForm.isNew} onChange={(e) => setProductForm({ ...productForm, isNew: e.target.checked })} className="accent-black" />
                  New arrival
                </label>
                <label className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold cursor-pointer">
                  <input type="checkbox" checked={productForm.isFeatured} onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })} className="accent-black" />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.status === "HIDDEN"}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.checked ? "HIDDEN" : "ACTIVE" })}
                    className="accent-black"
                  />
                  Hide from store
                </label>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Crafted in polished pebble leather…"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={uploading || saving}
                className="w-full bg-black hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-widest py-4 rounded-xl disabled:opacity-60 cursor-pointer"
              >
                {saving ? "Saving…" : editingId ? "Save changes" : "Save product"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
