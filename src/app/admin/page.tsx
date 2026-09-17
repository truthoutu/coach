"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toNumber } from "@/lib/money";
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
  Gift,
  Send,
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

interface GiftCardSubmission {
  id: string;
  brand: string;
  codeLast4: string;
  claimedValue: string | null;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  order: {
    id: string;
    number: string;
    customerName: string;
    email: string;
    phone: string | null;
    total: string;
    status: string;
  };
}

interface AdminMessage {
  id: string;
  senderRole: "CUSTOMER" | "ADMIN";
  body: string;
  createdAt: string;
}

const CATEGORIES = ["Bags", "Shoes", "Wallets", "Accessories", "Small Leather Goods", "Ready-To-Wear"];

// ── Quick payment details ("tags") the admin sends to customers ─────────────
// ⚠️ EDIT THESE to the store's real handles / addresses.
const PAYMENT_TAGS: { label: string; body: string }[] = [
  { label: "💜 Zelle", body: "💜 Send your Zelle payment to: 505-800-6451 (name: COACH 1). Reply \"I have paid\" here once sent." },
  { label: "💚 Cash App", body: "💚 Send your Cash App payment to: $CoachOne. Reply \"I have paid\" here once sent." },
  { label: "🟢 Chime", body: "🟢 Send your Chime payment to: 505-800-6451. Reply \"I have paid\" here once sent." },
  { label: "₿ Bitcoin", body: "₿ Send exactly the order total in BTC to: bc1qjs86eudh7t00de2f9e94zy6p8pcznjhyqqh3w8 — then reply here with the transaction ID." },
];

/** Short notification beep (WebAudio). Safe no-op when unsupported. */
function playBeep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    /* silent */
  }
}

export default function AdminPage() {
  const [activeNav, setActiveNav] = useState<"overview" | "products" | "campaigns" | "orders" | "giftcards">("overview");
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

  // Gift card submissions state
  const [giftCards, setGiftCards] = useState<GiftCardSubmission[]>([]);
  const [giftCardsLoading, setGiftCardsLoading] = useState(true);
  const [revealedCodes, setRevealedCodes] = useState<Record<string, string>>({});

  // Live notification state (polled from /api/admin/live every 5s)
  const [liveStats, setLiveStats] = useState({ pendingOrders: 0, unreadCustomerMessages: 0, pendingGiftCards: 0 });
  const [liveOn, setLiveOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const livePrevRef = useRef({ pendingOrders: 0, unreadCustomerMessages: 0, pendingGiftCards: 0 });
  const liveInitRef = useRef(false);

  // Per-order live thread state (chat with customer + actions)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Record<string, AdminMessage[]>>({});
  const [threadLoading, setThreadLoading] = useState<Record<string, boolean>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<Record<string, boolean>>({});
  const [actingOrder, setActingOrder] = useState<Record<string, boolean>>({});
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Pending orders popup modal
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingOrdersDismissed, setPendingOrdersDismissed] = useState<Set<string>>(new Set());
  const [paymentDetailInputs, setPaymentDetailInputs] = useState<Record<string, string>>({});
  const [sendingPaymentDetails, setSendingPaymentDetails] = useState<Record<string, boolean>>({});

  // Upload & Toast state
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCampaigns();
    fetchOrders();
    fetchGiftCards();
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

  async function fetchGiftCards() {
    setGiftCardsLoading(true);
    try {
      const res = await fetch("/api/gift-cards");
      if (res.ok) {
        const data = await res.json();
        setGiftCards(data.submissions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGiftCardsLoading(false);
    }
  }

  async function handleGiftCardAction(id: string, action: "verify" | "reject" | "reveal") {
    try {
      if (action === "reveal") {
        const res = await fetch(`/api/gift-cards/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reveal" }),
        });
        const data = await res.json();
        if (res.ok) {
          setRevealedCodes((prev) => ({
            ...prev,
            [id]: data.pin ? `${data.code} · PIN: ${data.pin}` : data.code,
          }));
        } else {
          setToast({ text: data.error || "Could not reveal this code.", type: "error" });
        }
        return;
      }

      if (action === "verify") {
        const confirmOrder = window.confirm(
          "Mark this gift card as verified?\n\nOK = verify the card AND confirm the linked order.\nCancel = verify the card only."
        );
        const res = await fetch(`/api/gift-cards/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify", confirmOrder }),
        });
        const data = await res.json();
        if (res.ok) {
          setToast({ text: "Gift card marked as verified.", type: "success" });
          fetchGiftCards();
          fetchOrders();
        } else {
          setToast({ text: data.error || "Could not verify this card.", type: "error" });
        }
        return;
      }

      // reject
      const reason = window.prompt("Reason for rejecting this gift card (optional):") ?? "";
      const res = await fetch(`/api/gift-cards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reviewNotes: reason || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ text: "Gift card rejected. Keep the order on hold.", type: "success" });
        fetchGiftCards();
      } else {
        setToast({ text: data.error || "Could not reject this card.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ text: "Action failed. Please try again.", type: "error" });
    }
  }

  // ── Live notifications: poll /api/admin/live every 5s ─────────────────────
  // Compares counts with the previous snapshot so the beep/toast only fires
  // when something genuinely new arrives (order, customer message, card).
  useEffect(() => {
    if (!liveOn) return;
    let cancelled = false;

    async function pollAdminLive() {
      try {
        const res = await fetch("/api/admin/live");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const next = data.stats ?? { pendingOrders: 0, unreadCustomerMessages: 0, pendingGiftCards: 0 };
        setLiveStats(next);

        const prev = livePrevRef.current;
        if (liveInitRef.current) {
          const events: string[] = [];
          if (next.pendingOrders > prev.pendingOrders) {
            events.push(`🛍️ New order received (${next.pendingOrders - prev.pendingOrders} new) — open Orders.`);
          }
          if (next.unreadCustomerMessages > prev.unreadCustomerMessages) {
            events.push(`💬 New customer message (${next.unreadCustomerMessages - prev.unreadCustomerMessages} unread) — open the order thread.`);
          }
          if (next.pendingGiftCards > prev.pendingGiftCards) {
            events.push(`🎁 New gift card submitted (${next.pendingGiftCards - prev.pendingGiftCards} awaiting check).`);
          }
          if (events.length > 0) {
            if (soundOn) playBeep();
            setToast({ text: events.join(" "), type: "success" });
            fetchOrders();
            fetchGiftCards();
          } else if (
            next.pendingOrders !== prev.pendingOrders ||
            next.unreadCustomerMessages !== prev.unreadCustomerMessages ||
            next.pendingGiftCards !== prev.pendingGiftCards
          ) {
            // Counts decreased (order confirmed, thread read elsewhere) — refresh quietly.
            fetchOrders();
            fetchGiftCards();
          }
        } else {
          liveInitRef.current = true;
        }
        livePrevRef.current = next;
      } catch {
        /* offline / DB down — next tick retries */
      }
    }

    pollAdminLive();
    const id = setInterval(pollAdminLive, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [liveOn, soundOn]);

  // ── Show pending orders popup when there are new pending orders ─────────
  useEffect(() => {
    if (liveStats.pendingOrders > 0) {
      const pendingOrdersNeedingAction = orders.filter(
        (o) => o.status === "PENDING_PAYMENT" && !pendingOrdersDismissed.has(o.id)
      );
      if (pendingOrdersNeedingAction.length > 0) {
        setShowPendingModal(true);
      }
    }
  }, [liveStats.pendingOrders, orders, pendingOrdersDismissed]);

  // ── Per-order live thread (chat + actions) ─────────────────────────────────
  async function loadThread(orderNumber: string) {
    setThreadLoading((prev) => ({ ...prev, [orderNumber]: true }));
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/messages`);
      if (res.ok) {
        const data = await res.json();
        setThreadMessages((prev) => ({ ...prev, [orderNumber]: data.messages || [] }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setThreadLoading((prev) => ({ ...prev, [orderNumber]: false }));
    }
  }

  function toggleOrderThread(ord: Order) {
    if (expandedOrder === ord.number) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(ord.number);
    loadThread(ord.number);
  }

  async function sendQuickTag(orderNumber: string, body: string) {
    setSendingReply((prev) => ({ ...prev, [orderNumber]: true }));
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: true, body }),
      });
      if (res.ok) {
        loadThread(orderNumber);
        setToast({ text: "Payment details sent to the customer.", type: "success" });
      } else {
        setToast({ text: "Could not send. Please try again.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ text: "Could not send. Please try again.", type: "error" });
    } finally {
      setSendingReply((prev) => ({ ...prev, [orderNumber]: false }));
    }
  }

  async function sendPaymentDetailsDirect(orderNumber: string, paymentMethod: string, customDetails: string) {
    setSendingPaymentDetails((prev) => ({ ...prev, [orderNumber]: true }));
    try {
      // Get the appropriate payment message based on method
      let message = "";
      if (customDetails.trim()) {
        message = customDetails.trim();
      } else {
        const tag = PAYMENT_TAGS.find((t) => t.label.toLowerCase().includes(paymentMethod.toLowerCase()));
        message = tag ? tag.body : `Payment details for ${paymentMethod}`;
      }

      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: true, body: message }),
      });
      if (res.ok) {
        setToast({ text: `Payment details sent to customer for ${paymentMethod}`, type: "success" });
        setPendingOrdersDismissed((prev) => new Set([...prev, orderNumber]));
        // Refresh orders to update status
        fetchOrders();
      } else {
        setToast({ text: "Could not send payment details. Please try again.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ text: "Could not send payment details. Please try again.", type: "error" });
    } finally {
      setSendingPaymentDetails((prev) => ({ ...prev, [orderNumber]: false }));
    }
  }

  async function sendAdminReply(orderNumber: string) {
    const text = (replyInputs[orderNumber] || "").trim();
    if (!text) return;
    setReplyInputs((prev) => ({ ...prev, [orderNumber]: "" }));
    await sendQuickTag(orderNumber, text);
  }

  // Keep the open thread fresh while it is expanded.
  useEffect(() => {
    if (!expandedOrder || !liveOn) return;
    const id = setInterval(() => loadThread(expandedOrder), 4000);
    return () => clearInterval(id);
  }, [expandedOrder, liveOn]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [expandedOrder, threadMessages]);

  async function handleOrderStatus(orderNumber: string, action: "confirm" | "cancel") {
    const label = action === "confirm" ? "Confirm this order's payment?" : "Cancel this order?";
    if (!window.confirm(label)) return;
    setActingOrder((prev) => ({ ...prev, [orderNumber]: true }));
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setToast({
          text: action === "confirm" ? "Payment confirmed — the customer sees it live. ✅" : "Order cancelled.",
          type: "success",
        });
        fetchOrders();
        fetchGiftCards();
      } else {
        setToast({ text: data.error || "Could not update this order.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ text: "Could not update this order.", type: "error" });
    } finally {
      setActingOrder((prev) => ({ ...prev, [orderNumber]: false }));
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

  // Money fields arrive from /api/orders already coerced to numbers, but
  // `toNumber` keeps the sum safe even if a legacy string slips through
  // (a string here would turn `sum` into concatenation and crash `.toFixed()`).
  const totalSales = orders.reduce((sum, o) => sum + toNumber(o.total), 0);

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

            <button
              onClick={() => setActiveNav("giftcards")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-colors justify-between cursor-pointer ${
                activeNav === "giftcards" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Gift size={18} /> Gift Cards
              </div>
              <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-full">
                {giftCards.filter((g) => g.status === "SUBMITTED").length}
              </span>
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
                <button
                  onClick={() => { setActiveNav("giftcards"); setMobileSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs uppercase tracking-wider font-semibold text-slate-300"
                >
                  <Gift size={18} /> Gift Cards ({giftCards.filter((g) => g.status === "SUBMITTED").length})
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
              {activeNav === "giftcards" && "Gift Card Payment Verifications"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Live notifications toggle */}
            <button
              onClick={() => setLiveOn((v) => !v)}
              title={liveOn ? "Pause live notifications" : "Resume live notifications"}
              className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full border transition-colors cursor-pointer ${
                liveOn
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-gray-100 text-gray-500 border-gray-200"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${liveOn ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
              {liveOn ? "Live" : "Paused"}
            </button>
            <button
              onClick={() => setSoundOn((v) => !v)}
              title={soundOn ? "Mute notification sound" : "Unmute notification sound"}
              className="text-gray-400 hover:text-black text-sm px-1.5 py-1.5 cursor-pointer"
            >
              {soundOn ? "🔔" : "🔕"}
            </button>
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

          {/* PENDING ORDERS POPUP MODAL */}
          {showPendingModal && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-gray-900">🔔 Send Payment Details Now</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Customers are waiting for payment details. Send them immediately below.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPendingModal(false)}
                    className="text-gray-400 hover:text-black cursor-pointer p-1"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {orders
                    .filter((o) => o.status === "PENDING_PAYMENT" && !pendingOrdersDismissed.has(o.id))
                    .map((ord) => (
                      <div
                        key={ord.id}
                        className="border-2 border-amber-300 rounded-xl p-5 bg-amber-50/50"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <span className="font-mono font-bold text-xl">{ord.number}</span>
                          <span className="text-sm font-medium text-gray-700">{ord.customerName}</span>
                          <span className="ml-auto bg-slate-900 text-white px-3 py-1.5 rounded-full font-bold uppercase text-xs">
                            {ord.paymentMethod}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 text-xs mb-4">
                          <span className="bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full font-mono font-bold">
                            ${toNumber(ord.total).toFixed(2)}
                          </span>
                          <span className="text-gray-500">
                            {ord.items.length} item{ord.items.length === 1 ? "" : "s"}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 mb-4">
                          {ord.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")}
                        </p>

                        {/* Quick send buttons based on payment method */}
                        <div className="space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Send payment details for {ord.paymentMethod}:
                          </p>
                          
                          <div className="flex flex-wrap gap-2">
                            {PAYMENT_TAGS.map((tag) => (
                              <button
                                key={tag.label}
                                onClick={() => sendPaymentDetailsDirect(ord.number, ord.paymentMethod, tag.body)}
                                disabled={sendingPaymentDetails[ord.number]}
                                className="text-xs font-bold bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {sendingPaymentDetails[ord.number] ? "Sending..." : tag.label}
                              </button>
                            ))}
                          </div>

                          {/* Custom message input */}
                          <div className="mt-3">
                            <textarea
                              placeholder="Or type custom payment details..."
                              value={paymentDetailInputs[ord.id] || ""}
                              onChange={(e) => setPaymentDetailInputs((prev) => ({ ...prev, [ord.id]: e.target.value }))}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-black resize-none"
                            />
                            <button
                              onClick={() => sendPaymentDetailsDirect(ord.number, ord.paymentMethod, paymentDetailInputs[ord.id] || "")}
                              disabled={sendingPaymentDetails[ord.number] || !paymentDetailInputs[ord.id]?.trim()}
                              className="mt-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {sendingPaymentDetails[ord.number] ? "Sending..." : "Send Custom Details"}
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-amber-200 flex justify-end">
                          <button
                            onClick={() => {
                              setPendingOrdersDismissed((prev) => new Set([...prev, ord.id]));
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 font-semibold cursor-pointer"
                          >
                            Dismiss this order
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {orders.filter((o) => o.status === "PENDING_PAYMENT" && !pendingOrdersDismissed.has(o.id)).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No pending orders needing payment details.</p>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={() => setShowPendingModal(false)}
                    className="text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-black cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
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
                            <td className="px-6 py-4 font-mono font-semibold">${toNumber(ord.total).toFixed(2)}</td>
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
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-serif text-xl font-bold">All Customer Orders</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">Click an order to chat, send payment details & confirm.</p>
                </div>
                <div className="flex items-center gap-2">
                  {(liveStats.pendingOrders > 0 || liveStats.unreadCustomerMessages > 0) && (
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">
                      {liveStats.pendingOrders} pending · {liveStats.unreadCustomerMessages} unread
                    </span>
                  )}
                  <button
                    onClick={fetchOrders}
                    className="text-xs font-mono font-semibold text-gray-600 hover:text-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>
              {ordersLoading ? (
                <div className="py-16 text-center text-gray-400 font-mono text-xs">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center text-gray-500 font-serif text-sm">
                  No orders yet. Orders placed at checkout will appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord) => {
                    const isOpen = expandedOrder === ord.number;
                    const thread = threadMessages[ord.number] || [];
                    const reply = replyInputs[ord.number] || "";
                    const pending = ord.status === "PENDING_PAYMENT";
                    const lastCustomerMsg = [...thread].reverse().find((m) => m.senderRole === "CUSTOMER");
                    return (
                      <div
                        key={ord.id}
                        className={`border rounded-xl overflow-hidden transition-colors ${
                          pending ? "border-amber-300 bg-amber-50/40" : "border-gray-200 bg-white"
                        }`}
                      >
                        <button
                          onClick={() => toggleOrderThread(ord)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50/60 transition-colors cursor-pointer"
                        >
                          <span className="font-mono font-bold text-sm">{ord.number}</span>
                          <span className="text-xs font-medium truncate">{ord.customerName}</span>
                          <span className="hidden sm:inline text-[11px] text-gray-500 font-mono truncate max-w-56">
                            {ord.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")}
                          </span>
                          <span className="text-[11px] font-mono font-bold ml-auto whitespace-nowrap">
                            ${toNumber(ord.total).toFixed(2)}
                          </span>
                          <span className="hidden md:inline text-[10px] font-mono text-gray-500">{ord.paymentMethod}</span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${
                              pending
                                ? "bg-amber-100 text-amber-800"
                                : ord.status === "CONFIRMED" || ord.status === "DELIVERED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {ord.status.replace(/_/g, " ")}
                          </span>
                          {lastCustomerMsg && !isOpen && (
                            <span className="text-[10px] font-bold uppercase bg-rose-600 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                              New msg
                            </span>
                          )}
                          <span className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</span>
                        </button>
                        {/* Expanded live thread */}
                        {isOpen && (
                          <div className="border-t border-gray-200 bg-white px-4 py-4 space-y-4">
                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-gray-600">
                              <span>
                                <span className="font-bold">Items:</span>{" "}
                                {ord.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")}
                              </span>
                              <span>
                                <span className="font-bold">Contact:</span> {ord.email}
                              </span>
                              <span className="font-mono text-gray-400">
                                {new Date(ord.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {pending && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                  Send payment details to customer:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {PAYMENT_TAGS.map((tag) => (
                                    <button
                                      key={tag.label}
                                      onClick={() => sendQuickTag(ord.number, tag.body)}
                                      disabled={sendingReply[ord.number]}
                                      className="text-[11px] font-bold bg-slate-900 hover:bg-black text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                      {tag.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                              <div className="px-3.5 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
                                <p className="text-[11px] font-bold">Live thread with {ord.customerName}</p>
                                <span className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                                </span>
                              </div>
                              <div className="px-3.5 py-3 space-y-2.5 max-h-64 overflow-y-auto">
                                {threadLoading[ord.number] ? (
                                  <p className="text-[11px] text-gray-400 font-mono py-3 text-center">Loading thread…</p>
                                ) : thread.length === 0 ? (
                                  <p className="text-[11px] text-gray-400 py-2">
                                    No messages yet — the customer is waiting for your payment details.
                                  </p>
                                ) : (
                                  thread.map((m) => (
                                    <div
                                      key={m.id}
                                      className={`max-w-[88%] rounded-lg px-3 py-2 text-[12px] leading-relaxed ${
                                        m.senderRole === "ADMIN"
                                          ? "bg-gray-100 border border-gray-200 text-gray-900"
                                          : "bg-slate-900 text-white ml-auto"
                                      }`}
                                    >
                                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                      <p className={`text-[10px] mt-1 ${m.senderRole === "ADMIN" ? "text-gray-400" : "text-white/60"}`}>
                                        {m.senderRole === "ADMIN" ? "You" : ord.customerName} ·{" "}
                                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                      </p>
                                    </div>
                                  ))
                                )}
                                <div ref={threadEndRef} />
                              </div>
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  sendAdminReply(ord.number);
                                }}
                                className="px-3.5 py-3 border-t border-gray-100 flex items-center gap-2"
                              >
                                <input
                                  type="text"
                                  placeholder="Write a reply…"
                                  value={reply}
                                  onChange={(e) => setReplyInputs((prev) => ({ ...prev, [ord.number]: e.target.value }))}
                                  maxLength={1000}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-black"
                                />
                                <button
                                  type="submit"
                                  disabled={sendingReply[ord.number] || !reply.trim()}
                                  className="p-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
                                  aria-label="Send reply"
                                >
                                  {sendingReply[ord.number] ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                                </button>
                              </form>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {pending ? (
                                <>
                                  <button
                                    onClick={() => handleOrderStatus(ord.number, "confirm")}
                                    disabled={actingOrder[ord.number]}
                                    className="text-[11px] font-bold uppercase bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                                  >
                                    <CheckCircle2 size={14} /> Confirm Payment ✅
                                  </button>
                                  <button
                                    onClick={() => handleOrderStatus(ord.number, "cancel")}
                                    disabled={actingOrder[ord.number]}
                                    className="text-[11px] font-bold uppercase bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                                  >
                                    Decline / Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => loadThread(ord.number)}
                                  className="text-[11px] font-semibold text-gray-500 hover:text-black flex items-center gap-1.5 cursor-pointer"
                                >
                                  <RefreshCw size={12} /> Refresh thread
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW 5: GIFT CARD VERIFICATIONS */}
          {activeNav === "giftcards" && (
            <div className="space-y-8">
              {/* Explanation Banner */}
              <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex items-start gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-white">
                  <Gift size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold">Gift Card Payment Verifications</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">
                    Customers paying with a gift card submit their code at checkout. Verify each code with the
                    issuer, then mark it <span className="font-bold">Verified</span> (optionally confirming the
                    linked order) or <span className="font-bold">Rejected</span>. Codes are stored encrypted —
                    only the last 4 characters show here until you reveal one.
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="font-serif text-lg font-bold border-b border-gray-200 pb-3 mb-2">Submissions</h2>
                {giftCardsLoading ? (
                  <div className="py-16 text-center text-gray-400 font-mono text-xs">Loading gift card submissions...</div>
                ) : giftCards.length === 0 ? (
                  <div className="py-16 text-center text-gray-500 font-serif text-sm">
                    No gift card submissions yet. Orders paid by gift card will appear here.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3">Order</th>
                          <th className="px-6 py-3">Customer</th>
                          <th className="px-6 py-3">Card</th>
                          <th className="px-6 py-3">Claimed</th>
                          <th className="px-6 py-3">Order Status</th>
                          <th className="px-6 py-3">Card Status</th>
                          <th className="px-6 py-3">Actions</th>
                          <th className="px-6 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {giftCards.map((sub) => (
                          <tr key={sub.id}>
                            <td className="px-6 py-4 font-mono font-bold">{sub.order.number}</td>
                            <td className="px-6 py-4">
                              <span className="block">{sub.order.customerName}</span>
                              <span className="text-gray-500">{sub.order.email}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="block font-semibold">{sub.brand.replace(/_/g, " ")}</span>
                              {revealedCodes[sub.id] ? (
                                <span className="font-mono text-[11px] bg-gray-100 px-2 py-1 rounded">{revealedCodes[sub.id]}</span>
                              ) : (
                                <span className="font-mono text-gray-500">•••• {sub.codeLast4}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-mono">
                              {sub.claimedValue ? `$${toNumber(sub.claimedValue).toFixed(2)}` : "—"}
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">
                                {sub.order.status.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                                  sub.status === "VERIFIED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : sub.status === "REJECTED"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {sub.status === "SUBMITTED" ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    onClick={() => handleGiftCardAction(sub.id, "verify")}
                                    className="text-[10px] font-bold uppercase bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                                  >
                                    Verify
                                  </button>
                                  <button
                                    onClick={() => handleGiftCardAction(sub.id, "reject")}
                                    className="text-[10px] font-bold uppercase bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => handleGiftCardAction(sub.id, "reveal")}
                                    className="text-[10px] font-bold uppercase bg-gray-800 hover:bg-black text-white px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                                  >
                                    Reveal Code
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {sub.reviewNotes && (
                                    <span className="text-gray-500 italic" title={sub.reviewNotes}>
                                      {sub.reviewNotes.slice(0, 40)}
                                    </span>
                                  )}
                                  {!revealedCodes[sub.id] && (
                                    <button
                                      onClick={() => handleGiftCardAction(sub.id, "reveal")}
                                      className="text-[10px] font-bold uppercase bg-gray-800 hover:bg-black text-white px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                                    >
                                      Reveal Code
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 font-mono text-gray-500">{new Date(sub.createdAt).toLocaleString()}</td>
                          </tr>
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