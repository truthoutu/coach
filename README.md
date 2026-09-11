# COACH E-Commerce Platform

Modern luxury e-commerce platform built with Next.js 16, TypeScript, Prisma, and PostgreSQL.

## 🚀 Features

- **Product Catalog** - Dynamic product listings with categories
- **Shopping Cart** - Full cart functionality with persistent state
- **Multiple Payment Methods** - Bitcoin, Credit Card, Zelle, Chime, Gift Cards
- **Admin Dashboard** - Manage products and campaigns
- **Campaign Management** - Featured banners and promotional content
- **Tawk.to Live Chat** - Global live-chat widget (replaces the legacy WhatsApp floating button)
- **Responsive Design** - Mobile-first, fully responsive UI

## 📦 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Deployment:** Vercel

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 20+ 
- npm or yarn
- PostgreSQL database (Neon recommended)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/truthoutu/coach.git
cd coach
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file:
```env
DATABASE_URL="your_neon_postgres_url"
DATABASE_URL_UNPOOLED="your_neon_postgres_url"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your_upload_preset"
# ── Tawk.to live chat ────────────────────────────────────────────────────────
# The official owner-supplied credentials are already baked into
# src/components/layout/FloatingChat.tsx and work with NO setup:
#   property 6aa17322094d073447a182b4 / widget 1k23ajhur
# These NEXT_PUBLIC_ vars are OPTIONAL overrides (staging, etc.), never required.
NEXT_PUBLIC_TAWK_PROPERTY_ID="6aa17322094d073447a182b4"
NEXT_PUBLIC_TAWK_WIDGET_ID="1k23ajhur"
```

4. **Push database schema**
```bash
npm run db:push
```

5. **Seed the database**
```bash
npm run db:seed
```

6. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🌐 Deployment

### Vercel Deployment

1. **Connect GitHub repository to Vercel**
2. **Set environment variables in Vercel:**
   - `DATABASE_URL`
   - `DATABASE_URL_UNPOOLED`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

3. **Deploy** - Vercel will automatically build and deploy

### Important: Seed Database After First Deploy

After your first deployment, you need to seed the database with initial products and campaigns:

**Option 1: Use Vercel CLI**
```bash
vercel env pull .env.production.local
npm run db:seed
```

**Option 2: Via Admin Panel**
Visit `/admin` on your deployed site and manually add products and campaigns.

## 📱 Contact Information

- **WhatsApp:** https://wa.me/15058006924
- **Bitcoin Address:** `bc1qgt2sl66ykgs272p03rk5e4c92vcwr80y8k6s4t`

## 📁 Project Structure

```
coach/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seed data
├── public/                    # Static assets
├── src/
│   ├── app/
│   │   ├── admin/            # Admin dashboard
│   │   ├── api/              # API routes
│   │   ├── cart/             # Shopping cart page
│   │   ├── checkout/         # Checkout flow
│   │   ├── category/         # Category pages
│   │   └── product/          # Product detail pages
│   ├── components/
│   │   ├── home/            # Home page components
│   │   ├── layout/          # Layout components (Navbar, Footer, etc)
│   │   └── product/         # Product components
│   ├── context/
│   │   └── CartContext.tsx  # Shopping cart state management
│   └── lib/
│       └── prisma.ts        # Prisma client
└── package.json
```

## 🗃️ Database Schema

### Product
- `id` - Unique identifier
- `name` - Product name
- `price` - Display price
- `image` - Product image URL
- `category` - Product category
- `isNew` - New arrival flag
- `description` - Product description

### Campaign
- `id` - Unique identifier
- `title` - Campaign title
- `subtitle` - Campaign subtitle
- `image` - Banner image URL
- `link` - Campaign link
- `isFeatured` - Featured flag
- `displayOrder` - Display order

## 🔑 API Routes

- `GET /api/products` - Fetch all products
- `POST /api/products` - Create new product
- `DELETE /api/products?id=` - Delete product
- `GET /api/campaigns` - Fetch all campaigns
- `POST /api/campaigns` - Create new campaign
- `DELETE /api/campaigns?id=` - Delete campaign
- `POST /api/upload` - Upload images to Cloudinary

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with initial data
```

## 🎨 Customization

### Configure Tawk.to Live Chat
The Tawk widget replaces the old WhatsApp floating button. It is the **single** chat integration point, rendered from `src/app/layout.tsx` via `src/components/layout/FloatingChat.tsx`, and loads exactly once per page session (client-side only). Tawk controls the widget's appearance, position, and behavior from the Tawk.to dashboard — no custom floating button exists anymore.

The **official owner-supplied credentials** are baked into the component:
- `NEXT_PUBLIC_TAWK_PROPERTY_ID=6aa17322094d073447a182b4`
- `NEXT_PUBLIC_TAWK_WIDGET_ID=1k23ajhur`

These are public embed identifiers (part of the official embed script served to every visitor) — safe for the browser. You do **not** need to set anything to enable the widget. If you ever need a different widget (e.g. staging), you can override per environment with the same `NEXT_PUBLIC_*` vars (see `.env.example`).

### Update WhatsApp Number (checkout support / footer only)
Edit in:
- `src/components/layout/Footer.tsx`
- `src/app/checkout/page.tsx`

### Update Bitcoin Address
Edit in:
- `src/app/checkout/page.tsx`

### Add Products/Campaigns
1. Via Admin Panel: `/admin`
2. Via Database: Update `prisma/seed.ts` and run `npm run db:seed`

## 🐛 Troubleshooting

**Database connection issues:**
- Verify DATABASE_URL is correct in environment variables
- Check Neon database is active and not suspended
- Ensure IP allowlist includes your deployment platform

**Images not loading:**
- Verify Cloudinary credentials are correct
- Check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is set
- Ensure upload preset is configured in Cloudinary dashboard

**Products/Campaigns not showing:**
- Database might be empty - run `npm run db:seed`
- Check API routes are returning data: `/api/products` and `/api/campaigns`

## 📄 License

Private - All rights reserved

## 🤝 Support

- **Live chat:** Tawk.to widget (configured via `NEXT_PUBLIC_TAWK_PROPERTY_ID` / `NEXT_PUBLIC_TAWK_WIDGET_ID`)
- **WhatsApp (checkout support):** https://wa.me/15058006924
