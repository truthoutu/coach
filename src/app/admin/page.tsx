"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  compareAtPrice: number | null;
  compareAtPriceLabel: string | null;
  image: string;
  category: string;
  subcategory: string | null;
  gender: string;
  collection: string | null;
  inventory: number;
  sku: string | null;
  isNew: boolean;
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
  quantity: number;
  priceLabel?: string;
}

interface Order {
  id: string;
  number: string;
  customerName: string;
  email: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

const CATEGORIES = ["Bags", "Shoes", "Wallets", "Accessories", "Small Leather Goods", "Ready-To-Wear"];

export default function AdminPage() {
  const [activeNav, setActiveNav] = useState<"overview" | "products" | "campaigns" | "orders">("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter state for products
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    compareAtPrice: "",
    image: "",
    category: "Bags",
    subcategory: "",
    gender: "Unisex",
    collection: "",
    inventory: "0",
    isNew: true,
    description: "",
  });

  // Campaigns state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignForm, setCampaignForm] = useState({
    title: "",
    subtitle: "",
    image: "",
    link: "",
    isFeatured: false,
    displayOrder: 1,
  });

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Upload & Toast state
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCampaigns();
    fetchOrders();
  }, []);

  async function fetchProducts() {
    setProductLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProductLoading(false);
    }
  }

  async function fetchCampaigns() {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchOrders() {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "product" | "campaign") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setToast(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        if (target === "product") {
          setProductForm((prev) => ({ ...prev, image: data.url }));
        } else {
          setCampaignForm((prev) => ({ ...prev, image: data.url }));
        }
        setToast({ text: "Photo uploaded successfully!", type: "success" });
      } else {
        setToast({ text: data.error || "Failed to upload photo", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ text: "Error uploading image file", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.image) {
      setToast({ text: "Please fill in product title, price, and photo.", type: "error" });
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productForm.name,
          price: productForm.price,
          compareAtPrice: productForm.compareAtPrice || undefined,
          image: productForm.image,
          category: productForm.category,
          subcategory: productForm.subcategory || undefined,
          gender: productForm.gender,
          collection: productForm.collection || undefined,
          inventory: productForm.inventory,
          isNew: productForm.isNew,
          description: productForm.description,
        }),
      });

      if (res.ok) {
        setToast({ text: "Product added successfully!", type: "success" });
        setProductForm({
          name: "",
          price: "",
          compareAtPrice: "",
          image: "",
          category: "Bags",
          subcategory: "",
          gender: "Unisex",
          collection: "",
          inventory: "0",
          isNew: true,
          description: "",
        });
        setIsAddModalOpen(false);
        fetchProducts();
      } else {
        const data = await res.json();
        setToast({ text: data.error || "Failed to add product", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ text: "Server error creating product", type: "error" });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to remove this product?")) return;
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

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.title || !campaignForm.image) {
      setToast({ text: "Please fill in banner title and photo.", type: "error" });
      return;
    }

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignForm),
      });

      if (res.ok) {
        setToast({ text: "Homepage picture saved!", type: "success" });
        setCampaignForm({
          title: "",
          subtitle: "",
          image: "",
          link: "",
          isFeatured: false,
          displayOrder: 1,
        });
        fetchCampaigns();
      } else {
        const data = await res.json();
        setToast({ text: data.error || "Failed to add picture", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ text: "Server error creating campaign", type: "error" });
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to remove this homepage picture?")) return;
    try {
      const res = await fetch(`/api/campaigns?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        setToast({ text: "Homepage picture removed.", type: "success" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans flex">
      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-white flex-col justify-between p-6 flex-shrink-0 border-r border-slate-800">
        <div className="space-y-8">
          {/* Brand Identity */}
          <div className="border-b border-slate-800 pb-6">
            <Link href="/" className="font-serif text-2xl font-bold uppercase tracking-widest text-white block">
              COACH 1
            </Link>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mt-1">
              Store Manager
            </span>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveNav("overview")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                activeNav === "overview" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <LayoutDashboard size={18} /> Overview
            </button>

            <button
              onClick={() => setActiveNav("products")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-colors justify-between cursor-pointer ${
                activeNav === "products" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} /> Products
              </div>
              <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-full">{products.length}</span>
            </button>

            <button
              onClick={() => setActiveNav("campaigns")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-colors justify-between cursor-pointer ${
                activeNav === "campaigns" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <ImageIcon size={18} /> Homepage Pictures
              </div>
              <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-full">{campaigns.length}</span>
            </button>

            <button
              onClick={() => setActiveNav("orders")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-colors justify-between cursor-pointer ${
                activeNav === "orders" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package size={18} /> Orders & Sales
              </div>
              <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-full">{orders.length}</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-800 pt-6 space-y-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white font-semibold uppercase tracking-wider transition-colors"
          >
            <ExternalLink size={14} /> View Storefront
          </Link>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white uppercase">
              C1
            </div>
            <div>
              <p className="font-semibold text-white">Coach Admin</p>
              <p className="text-[10px] text-slate-500 font-mono">Store Manager</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE SIDEBAR MODAL OVERLAY */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 lg:hidden flex">
          <div className="w-64 bg-slate-900 text-white flex flex-col justify-between p-6 h-full">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <span className="font-serif text-xl font-bold uppercase tracking-widest text-white">COACH 1</span>
                <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => { setActiveNav("overview"); setMobileSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs uppercase tracking-wider font-semibold text-slate-300"
                >
                  <LayoutDashboard size={18} /> Overview
                </button>
                <button
                  onClick={() => { setActiveNav("products"); setMobileSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs uppercase tracking-wider font-semibold text-slate-300"
                >
                  <ShoppingBag size={18} /> Products ({products.length})
                </button>
                <button
                  onClick={() => { setActiveNav("campaigns"); setMobileSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs uppercase tracking-wider font-semibold text-slate-300"
                >
                  <ImageIcon size={18} /> Homepage Pictures ({campaigns.length})
                </button>
                <button
                  onClick={() => { setActiveNav("orders"); setMobileSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs uppercase tracking-wider font-semibold text-slate-300"
                >
                  <Package size={18} /> Orders ({orders.length})
                </button>
              </nav>
            </div>

            <Link href="/" className="text-xs text-slate-400 flex items-center gap-2">
              <ExternalLink size={14} /> Back to Store
            </Link>
          </div>
        </div>
      )}

      {/* MAIN MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TOP HEADER BAR */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-black"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-wider text-gray-900">
              {activeNav === "overview" && "Dashboard Overview"}
              {activeNav === "products" && "Product Catalog Management"}
              {activeNav === "campaigns" && "Homepage Banner Pictures"}
              {activeNav === "orders" && "Customer Orders & Transactions"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {activeNav === "products" && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-black hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={16} /> Add Product
              </button>
            )}
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 text-xs text-gray-600 hover:text-black font-semibold uppercase tracking-wider"
            >
              <Eye size={14} /> Storefront
            </Link>
          </div>
        </header>

        {/* BODY CONTAINER */}
        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
          {/* TOAST ALERTS */}
          {toast && (
            <div
              className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm transition-all ${
                toast.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                  : "bg-rose-50 text-rose-900 border border-rose-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className={toast.type === "success" ? "text-emerald-600" : "text-rose-600"} />
                <span>{toast.text}</span>
              </div>
              <button onClick={() => setToast(null)} className="text-xs font-bold uppercase hover:opacity-70 cursor-pointer">
                Dismiss
              </button>
            </div>
          )}

          {/* VIEW 1: OVERVIEW */}
          {activeNav === "overview" && (
            <div className="space-y-8">
              {/* Analytics Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-gray-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
                    <DollarSign size={18} className="text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold font-mono">${totalSales.toFixed(2)}</h3>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-gray-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Products</span>
                    <ShoppingBag size={18} className="text-black" />
                  </div>
                  <h3 className="text-2xl font-bold font-mono">{products.length} Items</h3>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-gray-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
                    <Package size={18} className="text-black" />
                  </div>
                  <h3 className="text-2xl font-bold font-mono">{orders.length}</h3>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="font-serif text-lg font-bold">Recent Customer Orders</h2>
                    <p className="text-xs text-gray-500">Orders placed through the checkout</p>
                  </div>
                  <button
                    onClick={() => setActiveNav("orders")}
                    className="text-xs font-semibold text-black uppercase tracking-wider hover:underline"
                  >
                    View All Orders →
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="py-16 text-center text-gray-500 font-serif text-sm">
                    No orders yet. Orders placed at checkout will appear here.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3">Order ID</th>
                          <th className="px-6 py-3">Customer</th>
                          <th className="px-6 py-3">Items</th>
                          <th className="px-6 py-3">Total</th>
                          <th className="px-6 py-3">Payment</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orders.slice(0, 8).map((ord) => (
                          <tr key={ord.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-mono font-bold">{ord.number}</td>
                            <td className="px-6 py-4 font-medium">{ord.customerName}</td>
                            <td className="px-6 py-4 text-gray-700">{ord.items.length} item{ord.items.length === 1 ? "" : "s"}</td>
                            <td className="px-6 py-4 font-mono font-semibold">${ord.total.toFixed(2)}</td>
                            <td className="px-6 py-4 font-mono text-gray-600">{ord.paymentMethod}</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
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

          {/* VIEW 2: PRODUCTS CATALOG */}
          {activeNav === "products" && (
            <div className="space-y-6">
              {/* Filter & Search Bar */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search product title or category..."
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                        selectedCategory === cat
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Data Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="font-serif text-lg font-bold">Catalog Items ({filteredProducts.length})</h2>
                  <button
                    onClick={fetchProducts}
                    className="text-xs font-mono font-semibold text-gray-600 hover:text-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>

                {productLoading ? (
                  <div className="py-16 text-center text-gray-400 font-mono text-xs">Loading catalog...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-16 text-center text-gray-500 text-xs">
                    No products found. Click <span className="font-bold text-black">+ Add Product</span> above to create one!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3">Product</th>
                          <th className="px-6 py-3">Category</th>
                          <th className="px-6 py-3">Gender</th>
                          <th className="px-6 py-3">Price</th>
                          <th className="px-6 py-3">Stock</th>
                          <th className="px-6 py-3">Badge</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredProducts.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative">
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <span className="font-semibold text-sm text-gray-900">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-gray-100 text-gray-800 text-[10px] font-bold uppercase px-2.5 py-1 rounded">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-700">{item.gender}</td>
                            <td className="px-6 py-4 font-mono font-bold">{item.priceLabel}</td>
                            <td className="px-6 py-4 font-mono">{item.inventory}</td>
                            <td className="px-6 py-4">
                              {item.isNew ? (
                                <span className="bg-black text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                                  New Arrival
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[10px]">Standard</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleDeleteProduct(item.id)}
                                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                              >
                                <Trash2 size={14} /> Remove
                              </button>
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

          {/* VIEW 3: HOMEPAGE PICTURES */}
          {activeNav === "campaigns" && (
            <div className="space-y-8">
              {/* Explanation Banner */}
              <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex items-start gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-white">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold">Homepage Picture Management</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">
                    Upload or update the large promotional pictures displayed on your storefront homepage. Add a link
                    (e.g. /category/women-bags) so banners navigate customers to a real collection.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form (5 cols) */}
                <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h2 className="font-serif text-lg font-bold border-b border-gray-200 pb-3">Add Homepage Banner Picture</h2>
                  <form onSubmit={handleAddCampaign} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                        Banner Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Shoulder Bags Campaign"
                        value={campaignForm.title}
                        onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                        Subtitle / Description
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Discover the new collection"
                        value={campaignForm.subtitle}
                        onChange={(e) => setCampaignForm({ ...campaignForm, subtitle: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                        Destinotion Link (e.g. /category/women-bags)
                      </label>
                      <input
                        type="text"
                        placeholder="/category/women-bags"
                        value={campaignForm.link}
                        onChange={(e) => setCampaignForm({ ...campaignForm, link: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                        Banner Photo *
                      </label>
                      <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 hover:border-black p-4 rounded-xl text-center flex flex-col items-center justify-center gap-1.5 transition-all">
                        <Upload size={20} className="text-black" />
                        <span className="text-xs font-bold uppercase tracking-wider text-black">
                          {uploading ? "Uploading Photo..." : "Choose Image File from Device"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "campaign")}
                          className="hidden"
                        />
                      </label>
                      {campaignForm.image && (
                        <div className="mt-3 relative aspect-video w-full rounded-lg overflow-hidden border border-gray-300">
                          <img src={campaignForm.image} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-black text-white py-3.5 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
                    >
                      Save Homepage Banner
                    </button>
                  </form>
                </div>

                {/* Campaign Grid (7 cols) */}
                <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h2 className="font-serif text-lg font-bold border-b border-gray-200 pb-3">Active Homepage Banners</h2>
                  {campaigns.length === 0 ? (
                    <p className="text-xs text-gray-500 font-mono py-8 text-center">No campaign banners added yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {campaigns.map((c) => (
                        <div key={c.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
                          <div className="w-24 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-serif font-bold text-base">{c.title}</h3>
                            {c.subtitle && <p className="text-xs text-gray-500">{c.subtitle}</p>}
                            {c.link && c.link !== "#" ? (
                              <span className="text-[10px] text-blue-600 font-mono">{c.link}</span>
                            ) : (
                              <span className="text-[10px] text-amber-600 font-mono">No link set</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteCampaign(c.id)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: ORDERS */}
          {activeNav === "orders" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold">All Customer Orders</h2>
                <button
                  onClick={fetchOrders}
                  className="text-xs font-mono font-semibold text-gray-600 hover:text-black flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
              {ordersLoading ? (
                <div className="py-16 text-center text-gray-400 font-mono text-xs">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center text-gray-500 font-serif text-sm">
                  No orders yet. Orders placed at checkout will appear here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3">Order ID</th>
                        <th className="px-6 py-3">Customer</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Items</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Payment</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders.map((ord) => (
                        <tr key={ord.id}>
                          <td className="px-6 py-4 font-mono font-bold">{ord.number}</td>
                          <td className="px-6 py-4">{ord.customerName}</td>
                          <td className="px-6 py-4 text-gray-700">{ord.email}</td>
                          <td className="px-6 py-4 text-gray-700">
                            {ord.items.map((it) => (
                              <span key={it.id} className="block">{it.name} ×{it.quantity}</span>
                            ))}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold">${ord.total.toFixed(2)}</td>
                          <td className="px-6 py-4 font-mono text-gray-600">{ord.paymentMethod}</td>
                          <td className="px-6 py-4">
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">
                              {ord.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-500">{new Date(ord.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* CLEAN CLIENT-FRIENDLY ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black cursor-pointer p-1"
            >
              <X size={20} />
            </button>

            <div>
              <h2 className="font-serif text-xl font-bold">Add New Product</h2>
              <p className="text-xs text-gray-500">Fill in product details and select a photo to display on your storefront</p>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-5">
              {/* Product Title */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Soft Tabby Hobo 26"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Price & Compare-at */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                    Price (USD) *
                  </label>
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
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                    Compare-at Price (optional)
                  </label>
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

              {/* Category / Gender / Collection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Gender</label>
                  <select
                    value={productForm.gender}
                    onChange={(e) => setProductForm({ ...productForm, gender: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black bg-white"
                  >
                    <option value="Women">Women</option>
                    <option value="Men">Men</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                    Subcategory (e.g. Shoulder Bags)
                  </label>
                  <input
                    type="text"
                    placeholder="Shoulder Bags"
                    value={productForm.subcategory}
                    onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                    Collection (e.g. Tabby)
                  </label>
                  <input
                    type="text"
                    placeholder="Tabby"
                    value={productForm.collection}
                    onChange={(e) => setProductForm({ ...productForm, collection: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* Inventory */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">Inventory</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={productForm.inventory}
                  onChange={(e) => setProductForm({ ...productForm, inventory: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {/* CLEAN CLIENT-FRIENDLY PHOTO UPLOADER */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-gray-800 mb-1.5">
                  Product Photo *
                </label>

                <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 hover:border-black p-6 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition-all group">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-sm group-hover:scale-110 transition-transform">
                    {uploading ? <RefreshCw size={22} className="animate-spin" /> : <Upload size={22} />}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-black mt-1">
                    {uploading ? "Uploading Photo..." : "Click to Choose Photo from Device"}
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">PNG, JPG, WEBP accepted</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "product")}
                    className="hidden"
                  />
                </label>

                {productForm.image ? (
                  <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-4">
                    <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-emerald-300 shadow-sm">
                      <img src={productForm.image} alt="Selected Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Photo Selected
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Mark as New Arrival Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalIsNew"
                  checked={productForm.isNew}
                  onChange={(e) => setProductForm({ ...productForm, isNew: e.target.checked })}
                  className="rounded text-black focus:ring-black h-4 w-4 accent-black cursor-pointer"
                />
                <label htmlFor="modalIsNew" className="text-xs uppercase tracking-wider font-bold text-gray-700 cursor-pointer select-none">
                  Mark as &quot;New Arrival&quot;
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Crafted in polished pebble leather with signature hardware..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-black hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-widest py-4 rounded-xl transition-colors shadow-md cursor-pointer mt-2"
              >
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}