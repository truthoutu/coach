# ✅ Deployment Checklist

## 🎯 Current Status

### ✅ Completed
- [x] GitHub repository connected to Vercel
- [x] Environment variables configured in Vercel
- [x] WhatsApp number updated: https://wa.me/15058006451
- [x] Bitcoin address updated: bc1qjs86eudh7t00de2f9e94zy6p8pcznjhyqqh3w8
- [x] Code pushed to GitHub (main branch)
- [x] Prisma schema configured
- [x] Seed data prepared

### ⚠️ Pending Action Required
- [ ] **Database needs to be seeded with initial products and campaigns**

## 📋 Vercel Environment Variables (Already Set)

✅ Required for database:
- `DATABASE_URL` = "postgresql://neondb_owner:..."
- `DATABASE_URL_UNPOOLED` = "postgresql://neondb_owner:..."

✅ Required for Cloudinary uploads:
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = "ol5yhqvr"
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` = (configured)

Optional (for signed uploads):
- `CLOUDINARY_API_KEY` = (optional)
- `CLOUDINARY_API_SECRET` = (optional)

## 🚀 Next Steps to Complete Deployment

### Step 1: Seed the Database

Choose ONE of these methods:

#### Option A: Via Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull .env.production.local

# Run seed
npm run db:seed
```

#### Option B: Via Admin Panel
1. Visit: https://your-site.vercel.app/admin
2. Manually add products with:
   - Name, Price, Image URL, Category, Description
3. Add campaigns with:
   - Title, Subtitle, Image URL, Link

#### Option C: Via Neon SQL Editor
1. Login to Neon dashboard
2. Open SQL Editor
3. Copy and run the SQL from `DEPLOYMENT.md`

### Step 2: Verify Deployment

Run the verification script:
```bash
npm run verify https://your-site.vercel.app
```

Or manually check:
- [ ] Homepage loads: https://your-site.vercel.app
- [ ] Products show on homepage
- [ ] Campaigns/banners show on homepage
- [ ] Admin panel accessible: /admin
- [ ] Cart works: /cart
- [ ] Checkout works: /checkout
- [ ] Tawk.to live chat loads (global widget, controlled from Tawk dashboard)
- [ ] Footer WhatsApp support link still works (wa.me/15058006451)
- [ ] Bitcoin address shows in checkout

### Step 3: Test Core Functionality

- [ ] Add product to cart
- [ ] View cart page
- [ ] Proceed to checkout
- [ ] Test each payment method:
  - [ ] Credit Card
  - [ ] Bitcoin (verify address shows)
  - [ ] Zelle (WhatsApp integration)
  - [ ] Chime (WhatsApp integration)
  - [ ] Gift Card
- [ ] Tawk.to chat widget appears (bottom corner, styled by Tawk dashboard)
- [ ] Click Footer WhatsApp button

## 🔍 Troubleshooting

### Database Empty?
**Symptom:** No products or campaigns show on homepage
**Solution:** Run `npm run db:seed` using Vercel CLI

### Images Not Uploading in Admin?
**Symptom:** Image upload fails in /admin panel
**Solution:** Verify Cloudinary env vars are set correctly in Vercel

### WhatsApp Not Working?
**Symptom:** WhatsApp links don't open correctly
**Solution:** Already fixed - number is configured correctly

### Bitcoin Address Not Showing?
**Symptom:** Bitcoin address doesn't show in checkout
**Solution:** Already fixed - address is configured correctly

## 📊 Expected Results After Seeding

### Products (4 total):
1. Tabby Shoulder Bag 26 - $450.00
2. Willow Saddle Bag - $395.00
3. Soft Tabby Hobo - $495.00
4. Studio Shoulder Bag - $450.00

### Campaigns (2 total):
1. Shoulder Bags (featured banner)
2. New Shoes (secondary banner)

## 🎨 Customization Options

After seeding, you can:

### Add More Products
Visit `/admin` and use the product form:
- Enter product details
- Upload image via Cloudinary
- Set category and price

### Add More Campaigns
Visit `/admin` and use the campaign form:
- Enter campaign title and subtitle
- Upload banner image
- Set display order

### Update Contact Info
- Tawk.to live chat: uses the official owner credentials baked into `src/components/layout/FloatingChat.tsx` (property `6aa17322094d073447a182b4`, widget `1k23ajhur`); override per environment with `NEXT_PUBLIC_TAWK_*` if needed
- WhatsApp (footer / checkout support): edit `src/components/layout/Footer.tsx` and `src/app/checkout/page.tsx`
- Bitcoin: edit `src/app/checkout/page.tsx`

## 📞 Support

- WhatsApp: https://wa.me/15058006451
- Bitcoin: bc1qjs86eudh7t00de2f9e94zy6p8pcznjhyqqh3w8

## 📚 Documentation

- `README.md` - General project overview
- `DEPLOYMENT.md` - Detailed deployment instructions
- `CHECKLIST.md` - This file
- `package.json` - Scripts and dependencies

## 🎉 You're Almost Done!

Once you seed the database, your site will be fully functional with:
- ✅ Products catalog
- ✅ Shopping cart
- ✅ Multiple payment methods
- ✅ WhatsApp support
- ✅ Bitcoin payments
- ✅ Admin dashboard
- ✅ Campaign management
