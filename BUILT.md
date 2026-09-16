# COACH 1 — Complete Build Documentation

## Overview
A premium fashion ecommerce storefront built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, Prisma, and Framer Motion. The design language is restrained, editorial, image-driven — inspired by global luxury fashion houses.

**Dev server:** http://localhost:3000

---

## 1. Design System (`src/app/globals.css`)

### Color Tokens (`@theme inline`)
| Token | Value | Usage |
|-------|-------|-------|
| `--color-ink` | `#111111` | Primary text, backgrounds |
| `--color-ink-soft` | `#4a4a4a` | Secondary text |
| `--color-muted` | `#757575` | Tertiary text, placeholders |
| `--color-hairline` | `#e5e5e5` | Borders, separators |
| `--color-paper` | `#ffffff` | White backgrounds |
| `--color-canvas` | `#f6f5f3` | Light editorial backgrounds |
| `--color-plp` | `#f3f3f3` | Product listing backgrounds |
| `--color-sale` | `#c0392b` | Sale pricing |
| `--color-alert` | `#a8231a` | Errors, destructive actions |

### Typography Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | `var(--font-sans)` | UI, navigation, body |
| `--font-serif` | `var(--font-serif)` | Editorial headlines, wordmark |
| `--tracking-nav` | `0.12em` | Navigation items |
| `--tracking-label` | `0.16em` | Buttons, labels, eyebrows |

### Border Radius

---

## 2. Layout Components (`src/components/layout/`)

### AnnouncementBar.tsx
- Dark brand bar (h-9, `#111111` background)
- Single "COACH" wordmark, centered, white text
- Scrolls away with page (not sticky)

### Navbar.tsx
Three-row header system:
1. **Utility row** (desktop, scrolls away): Locale selector left · Promo message center · Customer Care + Store Locator right
2. **Main row** (sticky, h-16/h-76): Hamburger menu (mobile) · Underlined search control (desktop) · Centered wordmark (absolutely centered to viewport) · Wishlist + Account + Search (mobile) + Bag icons
3. **Desktop nav row**: Centered category navigation with dropdowns

### DesktopNav.tsx
- Centered category navigation
- Hover/focus dropdown panels
- Items: Women, Men, New, Bags, Shoes, Wallets, Sale (highlighted red), Discover

### MobileMenu.tsx
- Full-screen slide-in drawer
- Accordion sub-menus for each category
- Account, wishlist, shopping bag links
- Customer care + policies
- Smooth Framer Motion animation

### SearchOverlay.tsx
- Full-screen overlay (Framer Motion)
- Search input with autofocus
- Escape key to close
- Instant results (client-side fetch to `/api/products`)
- Empty state with browse columns
- Trending + quick category links
- Keyboard accessible

### Logo.tsx
- Serif wordmark (EB Garamond)
- Uppercase, tracked letter-spacing
- Optical compensation for trailing tracking

### LocaleSelector.tsx
- Flag emoji + country code + chevron
- Compact, elegant trigger

### WishlistButton.tsx
- Heart icon (Lucide)
- Toggle selected state (filled heart)
- Persists to localStorage
- Hover feedback

### AccountButton.tsx
- User icon (Lucide)
- Links to account/authentication

### ShoppingBagButton.tsx
- Shopping bag icon (Lucide)
- Item count indicator
- Links to `/cart`

### FeedbackTab.tsx
- Fixed vertical black tab on right edge
- "Feedback" label, vertically oriented
- Opens FeedbackForm modal

### Footer.tsx
- Navigation columns (Women, Men, New, Bags, Shoes, Wallets, Sale, Discover)
- Customer Service links
- Company information
- Policies
- Social links
- Country/currency controls

---

## 3. Homepage Components (`src/components/home/`)

### Hero.tsx
- Full-bleed editorial campaign image
- Serif headline (large, restrained)
- Supporting copy
- Primary CTA (black button)
- Secondary CTA (outline button)

### ProductCarousel.tsx
- Horizontal scroll-snap carousel
- Left/right navigation arrows
- Edge bleed (products extend beyond container)
- Product cards: 3:4 aspect, hover-image swap, sale pricing, NEW badge

### CampaignGrid.tsx
- Large editorial image blocks
- Split layouts
- Campaign tiles with CTAs

### EditorialSection.tsx
- Fashion/lifestyle storytelling
- Large imagery + generous whitespace
- Serif headline + body + CTA
- Alternating `IMAGE | TEXT` / `TEXT | IMAGE` layouts

### ServiceSection.tsx
- Store locator, customization, product care, gifting, customer service
- Icon grid with labels

### NewsletterBand.tsx
- Clean premium newsletter signup
- Serif headline + email form

### SectionHeading.tsx
- Editorial section title (serif, tracked)

---

## 4. Product Components (`src/components/product/`)

### ProductCard.tsx
- 3:4 aspect ratio image area
- Hover second-image reveal
- Product name (small, restrained)
- Price (sale pricing in `--color-sale`)
- NEW badge (quiet, pill-shaped)
- Wishlist heart toggle
- Desktop quick-add "Add To Bag"
- Clean spacing, no borders/shadows

### ProductSwatches.tsx
- Tiny circular color swatches
- Selected state indicator
- Subtle, aligned

---

## 6. Pages (`src/app/`)

### `(storefront)/` route group
| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Homepage (Hero, ProductCarousel, CampaignGrid, EditorialSection ×2, ServiceSection, NewsletterBand) |
| `/[slug]` | Dynamic | Legal/content pages (terms, privacy, etc.) |
| `/category/[slug]` | Dynamic | Category/product listing page |
| `/product/[id]` | Dynamic | Product detail page |
| `/cart` | Static | Shopping cart page |

### Standalone pages
| Route | Type | Description |
|-------|------|-------------|
| `/checkout` | Static | Premium checkout (simplified header, order summary, billing/delivery forms, payment, place order) |
| `/admin` | Static | Admin dashboard (product management, campaign management, inventory, orders) |
| `/icon.svg` | Static | Favicon |

---

## 7. API Routes (`src/app/api/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | Fetch products (supports `?search=`, `?category=`, `?limit=`) |
| `/api/campaigns` | GET | Fetch campaign/editorial content |
| `/api/orders` | POST | Create new order (Bitcoin / Zelle / Chime / Cash App / Gift Card; gift card codes are encrypted at rest; seeds the live thread) |
| `/api/orders` | GET | Fetch orders (gift card codes masked to last 4) |
| `/api/orders/[number]/live` | GET | Customer live order status + thread (`?email=`; marks admin messages read) — polled by the tracker |
| `/api/orders/[number]/messages` | GET/POST | Per-order live thread; admin (`{ admin: true }`) or customer (`{ email }`) messages |
| `/api/orders/[number]/status` | PATCH | Admin: `confirm` (also flips a pending gift card to VERIFIED) / `cancel` / direct status |
| `/api/orders/[number]/gift-card` | POST | Customer gift card retry after a REJECTED card (replaces submission, posts thread note) |
| `/api/admin/live` | GET | Admin live counters (pending orders, unread customer messages, pending gift cards) |
| `/api/gift-cards` | GET | Admin: list gift card submissions (codes masked) |
| `/api/gift-cards/[id]` | PATCH | Admin actions: `verify` (optionally confirm order), `reject`, `reveal` (returns decrypted code) |
| `/api/newsletter` | POST | Newsletter subscription |
| `/api/feedback` | POST | Feedback form submission |
| `/api/upload` | POST | File upload |

> Gift card payments: the customer submits a third-party gift card code
> (Amazon, Visa/Mastercard prepaid, Steam, etc.) at checkout. The code is
> validated, AES-256-GCM encrypted (`GIFT_CARD_ENC_KEY`), and stored with the
> order; payment is verified manually via WhatsApp and the order stays
> `PENDING_PAYMENT` until the team confirms it in `/admin → Gift Cards`.
> Set `GIFT_CARD_ENC_KEY` (64 hex chars) in production.

---

## 8. Context & State (`src/context/`)

### CartContext.tsx
- `useCart()` hook
- `addToCart()`, `removeFromCart()`, `updateQuantity()`, `clearCart()`
- `totalItems`, `totalPrice`
- Persists to localStorage
- Bag count syncs across components

---

## 9. Library & Utilities (`src/lib/`)

### nav.ts
- `NAV_ITEMS` — Shared navigation model (Women, Men, New, Bags, Shoes, Wallets, Sale, Discover)
- `LOCALES` — Country/currency list (US, GB, CA, AU, FR, DE, AE, NG)
- `SEARCH_QUICK_LINKS` — Quick category links for search overlay
- Wishlist functions: `getWishlist()`, `isWishlisted()`, `toggleWishlist()`, `wishlistCount()`
- `WISHLIST_EVENT` — Custom event name for wishlist updates

### prisma.ts
- `hasDatabase()` — Checks if `DATABASE_URL` is configured
- Prisma client singleton
- Graceful degradation when DB is unavailable


---

## 11. Configuration

### next.config.ts
- Image domains: `images.unsplash.com`, `plus.unsplash.com`
- Turbopack enabled
- React strict mode

### tsconfig.json
- Path alias: `@/*` → `src/*`
- Target: ES2017
- Strict mode enabled

### package.json
| Dependency | Version | Usage |
|------------|---------|-------|
| `next` | 16.3.0 | Framework |
| `react` | 19.2.0 | UI |
| `react-dom` | 19.2.0 | DOM rendering |
| `typescript` | 5.9.3 | Type safety |
| `tailwindcss` | 4.1.12 | Styling |
| `@tailwindcss/postcss` | 4.1.12 | PostCSS plugin |
| `@tailwindcss/node` | 4.1.12 | Node plugin |
| `@prisma/client` | 6.19.3 | Database client |
| `prisma` | 6.19.3 | ORM CLI |
| `framer-motion` | 12.29.0 | Animations |
| `lucide-react` | 0.567.0 | Icons |

---

## 12. Image Assets (`public/`)

| File | Usage |
|------|-------|
| `hero-season-ahead.jpg` | Editorial hero image |
| `hero-tabby-street.png` | Tabby collection hero |
| `shoulder-bags.png` | Category/editorial imagery |

---

## 13. Verification Results

| Check | Result |
|-------|--------|
| `npx next build` | ✅ Compiled in 20.9s, 9/9 static pages |
| `npx tsc --noEmit` | ✅ Zero errors |
| Production server | ✅ Ready in 1.5s |
| `GET /` | ✅ 200 (64KB) |
| `GET /cart` | ✅ 200 |
| `GET /checkout` | ✅ 200 |
| `GET /admin` | ✅ 200 |
| `GET /terms` | ✅ 200 |
| `GET /product/does-not-exist` | ✅ 404 |
| Homepage markers | ✅ All 10 found (COACH, New Arrivals, Just In, Shop, Tabby, Sale, Feedback, Women, Men, Discover) |

---

## 14. Key Design Decisions

1. **No SaaS styling** — No excessive rounded cards, shadows, gradients, glassmorphism
2. **Restrained palette** — White, near-white, black, near-black, with subtle grays
3. **Typography hierarchy** — Serif for editorial/wordmark, sans-serif for UI
4. **Hairline borders** — Used sparingly for separators, form fields, selected states
5. **Rectangular buttons** — Primary (black), Outline (hairline), no pills
6. **Generous whitespace** — Large vertical breathing room between sections
7. **Image-first** — Large product images, 3:4 aspect ratio, no distortion
8. **Data-driven** — No hardcoded products, counts, prices, or categories
9. **Graceful degradation** — Works without a database (API routes return `[]`)
10. **Accessibility** — Semantic HTML, keyboard nav, focus states, aria labels, reduced motion support

---

## 15. To Go Live

1. Create `.env` with your real `DATABASE_URL`
2. Run `npx prisma migrate dev` to create tables
3. Run `npx prisma db seed` to seed sample data
4. Run `npm run build && npm start` for production

### money.ts
- `formatMoney()` — Formats prices with currency symbol
- `formatPriceRange()` — Formats price ranges

### serializers.ts
- `serializeProduct()` — Converts Prisma product to JSON-safe object
- `serializeProducts()` — Batch serialization

---

## 10. Database Schema (`prisma/schema.prisma`)

### Models
| Model | Description |
|-------|-------------|
| `Product` | id, slug, name, description, price, compareAtPrice, currency, category, subcategory, gender, collection, images[], sku, inventory, isNew, isFeatured, status, createdAt, updatedAt |
| `Campaign` | id, title, subtitle, image, link, isFeatured, displayOrder, createdAt, updatedAt |
| `Order` | id, number, customerName, email, phone, address, city, postalCode, country, itemsTotal, shippingCost, taxTotal, total, currency, status, paymentMethod, notes, createdAt, updatedAt |
| `OrderItem` | id, orderId, productId, name, sku, price, currency, quantity, image |
| `OrderMessage` | id, orderId, senderRole (`CUSTOMER`/`ADMIN`), body, readByAdmin, readByCustomer, createdAt — the live thread |
| `GiftCardSubmission` | id, orderId (unique), brand, codeEncrypted (AES-256-GCM), codeLast4, pinEncrypted, claimedValue, status, reviewNotes, createdAt, updatedAt |
| `NewsletterSubscription` | id, email, consent, source, createdAt |
| `Feedback` | id, name, email, message, createdAt |

### Enums
| Enum | Values |
|------|--------|
| `OrderStatus` | `PENDING_PAYMENT`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` |
| `PaymentMethod` | `BITCOIN`, `ZELLE`, `CHIME`, `CASHAPP`, `GIFT_CARD` |
| `GiftCardStatus` | `SUBMITTED`, `VERIFIED`, `REJECTED` |
| `SenderRole` | `CUSTOMER`, `ADMIN` |


### ProductDetailClient.tsx
- Large image gallery + vertical thumbnails
- Breadcrumbs (Women / Bags / Shoulder Bags / Product Name)
- Product title (serif)
- Rating row + review count
- Price (sale pricing)
- Color selector with swatches
- Quantity selector
- Add to Bag + Buy Now buttons
- Accordions: Shipping & Returns, Product Details, Measurements, Materials, Strap, Features, Editor's Notes
- Editorial `IMAGE | TEXT` / `TEXT | IMAGE` blocks
- Related products carousel
- JSON-LD structured product data

---

## 5. Category Components (`src/components/category/`)

### CategoryGrid.tsx
- Editorial category header + breadcrumbs
- "View All · N Products" count (from database)
- Pill filters: Color, Material, Price, Category
- Filter popovers with apply/clear/done
- Sort dropdown: Best Matches, Newest, Price Low-High, Price High-Low
- Mixed product + editorial grid tiles
- Load More pagination
- Empty state
- Responsive: 4-col desktop → 2-col mobile

### EditorialGridTile.tsx
- Image + eyebrow + headline + description + CTA
- Configurable grid span
- Belongs visually to the product grid

- Newsletter signup

### NewsletterForm.tsx
- Email input + submit button
- Posts to `/api/newsletter`
- Success/error states

### FloatingChat.tsx
- Fixed chat button (bottom-right)
- Chat widget interface

### SecurityGuard.tsx
- Security monitoring component

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-pill` | `999px` | Filter pills, swatch rings |

### CSS Helper Classes
- `.font-serif` — Serif font family
- `.text-label` — 11px tracked uppercase label
- `.headline-serif` — Editorial serif headline
- `.wordmark` — COACH wordmark (serif, uppercase, tracked)
- `.link-underline` — Animated underline on hover
- `.btn-primary` — Rectangular black button, white text
- `.btn-outline` — Hairline outline button
- `.hide-scrollbar` — Hide scrollbar but keep scroll
- `.rounded-pill` — Pill-shaped container

### Accessibility
- `:focus-visible` — 2px black outline with 2px offset
- `::selection` — Black background, white text
- `prefers-reduced-motion` — Disables all transitions/animations
