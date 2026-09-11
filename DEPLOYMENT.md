# 🚀 Deployment Guide

## Critical: Database Seeding Required

Your Vercel deployment is live but the database is **empty**. You need to seed it with initial products and campaigns.

## ✅ What's Already Done

- ✅ GitHub repository connected to Vercel
- ✅ Environment variables set in Vercel
- ✅ WhatsApp number configured: https://wa.me/15058006451
- ✅ Bitcoin address configured: bc1qjs86eudh7t00de2f9e94zy6p8pcznjhyqqh3w8
- ✅ Database schema deployed
- ⚠️ **Database is EMPTY** - needs seeding

## 🔴 What Needs to Be Done

### Option 1: Seed via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed)
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Link your project**
```bash
vercel link
```

4. **Pull environment variables**
```bash
vercel env pull .env.production.local
```

5. **Run the seed script**
```bash
npm run db:seed
```

This will populate your database with:
- 4 initial products (Tabby Shoulder Bag, Willow Saddle Bag, Soft Tabby Hobo, Studio Shoulder Bag)
- 2 initial campaigns (Shoulder Bags, New Shoes)

### Option 2: Seed via Admin Panel

1. Visit your deployed site at: `https://your-vercel-domain.vercel.app/admin`
2. Manually add products and campaigns through the admin interface
3. Upload images using Cloudinary integration

### Option 3: Seed via Direct Database Connection

If you have access to the Neon dashboard:

1. Go to your Neon console
2. Open the SQL Editor
3. Run the following queries:

```sql
-- Insert Products
INSERT INTO "Product" (id, name, price, image, category, "isNew", description, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'Tabby Shoulder Bag 26', '$450.00', 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1915&auto=format&fit=crop', 'Handbags', true, 'A modern take on an archival 1970s Coach design, the structured Tabby shoulder bag is crafted of polished pebble leather.', NOW(), NOW()),
  (gen_random_uuid(), 'Willow Saddle Bag', '$395.00', 'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=1974&auto=format&fit=crop', 'Handbags', false, 'Not too big, not too small, Willow is the perfect carry-it-all tote with space for all of your daily essentials.', NOW(), NOW()),
  (gen_random_uuid(), 'Soft Tabby Hobo', '$495.00', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1938&auto=format&fit=crop', 'Handbags', true, 'The Soft Tabby reimagines our structured take on an archival 1970s Coach design with a relaxed feel.', NOW(), NOW()),
  (gen_random_uuid(), 'Studio Shoulder Bag', '$450.00', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop', 'Handbags', false, 'A timeless style featuring our Signature push-lock closure, the Studio bag is crafted of smooth glove-tanned leather.', NOW(), NOW());

-- Insert Campaigns
INSERT INTO "Campaign" (id, title, subtitle, image, link, "isFeatured", "displayOrder", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'Shoulder Bags', 'Iconic silhouettes built for daily luxury', '/shoulder-bags.png', '#', true, 1, NOW(), NOW()),
  (gen_random_uuid(), 'New Shoes', 'Step into modern elegance', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012&auto=format&fit=crop', '#', false, 2, NOW(), NOW());
```

## 🔍 Verification

After seeding, verify everything is working:

1. **Check Products API**
   - Visit: `https://your-vercel-domain.vercel.app/api/products`
   - Should return JSON array with 4 products

2. **Check Campaigns API**
   - Visit: `https://your-vercel-domain.vercel.app/api/campaigns`
   - Should return JSON array with 2 campaigns

3. **Check Homepage**
   - Visit: `https://your-vercel-domain.vercel.app/`
   - Should see products and campaign banners

4. **Test Live Chat (Tawk.to)**
   - Global Tawk widget should load in the bottom corner (position/style controlled in the Tawk dashboard)
   - Official owner credentials are baked in (property `6aa17322094d073447a182b4`, widget `1k23ajhur`); no env setup required
   - Footer WhatsApp support link still opens wa.me/15058006451

5. **Test Checkout**
   - Add items to cart
   - Go to checkout
   - Select Bitcoin payment
   - Should see address: `bc1qjs86eudh7t00de2f9e94zy6p8pcznjhyqqh3w8`

## 🐛 Troubleshooting

### "Can't reach database server"
- Your local machine might not have access to the Neon database
- Use Option 1 (Vercel CLI) to seed from Vercel's environment
- Or use Option 3 (Direct SQL) from Neon dashboard

### "Prisma Client not found"
```bash
npm run postinstall
```

### Environment variables not loading
```bash
vercel env pull
```

### Database schema out of sync
```bash
npx prisma db push
```

## 📊 Current Configuration

### Vercel Environment Variables (Already Set)
- ✅ `DATABASE_URL`
- ✅ `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = "ol5yhqvr"
- ✅ `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` = (configured)

### Contact Information (Already Configured)
- ✅ WhatsApp: https://wa.me/15058006451
- ✅ Bitcoin: bc1qjs86eudh7t00de2f9e94zy6p8pcznjhyqqh3w8

## 🎯 Next Steps

1. **Seed the database** using one of the options above
2. **Test the site** to ensure products and campaigns are showing
3. **Add more products** via the admin panel at `/admin`
4. **Customize content** as needed

## 📞 Need Help?

If you encounter any issues:
1. Check Vercel deployment logs
2. Check Neon database logs
3. Verify all environment variables are set correctly in Vercel
4. Contact support via WhatsApp: https://wa.me/15058006451
