import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const force = process.argv.includes("--force");

  // Safety guard: never wipe live data by accident. The seed only replaces the
  // catalog if the database is empty, unless --force is explicitly passed.
  const existingProducts = await prisma.product.count();
  if (existingProducts > 0 && !force) {
    console.log(
      `Database already has ${existingProducts} products. Seeding skipped. ` +
        `Re-run with --force if you really want to replace the catalog.`
    );
    return;
  }

  console.log("Seeding database...");

  // Clear existing items
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.newsletterSubscription.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.product.deleteMany();
  await prisma.campaign.deleteMany();

  // ─── Products ─────────────────────────────────────────────────────────────
  const products = [
    {
      name: "Tabby Shoulder Bag 26",
      price: 450,
      compareAtPrice: 520,
      category: "Bags",
      subcategory: "Shoulder Bags",
      gender: "Women",
      collection: "Tabby",
      image:
        "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1915&auto=format&fit=crop",
      description:
        "A modern take on an archival 1970s Coach design, the structured Tabby shoulder bag is crafted of polished pebble leather with our Signature hardware and a comfortably adjustable strap.",
      isNew: true,
      isFeatured: true,
      inventory: 14,
      sku: "C0142-BK-U26",
    },
    {
      name: "Soft Tabby Hobo",
      price: 495,
      category: "Bags",
      subcategory: "Hobo Bags",
      gender: "Women",
      collection: "Tabby",
      image:
        "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1938&auto=format&fit=crop",
      description:
        "The Soft Tabby reimagines our structured take on an archival 1970s Coach design with a relaxed, slouchy feel and luxurious pebble leather.",
      isNew: true,
      isFeatured: true,
      inventory: 11,
      sku: "C1360-BK-HO",
    },
    {
      name: "Willow Saddle Bag",
      price: 395,
      compareAtPrice: 450,
      category: "Bags",
      subcategory: "Saddle Bags",
      gender: "Women",
      collection: "Willow",
      image:
        "https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=1974&auto=format&fit=crop",
      description:
        "Not too big, not too small — Willow is the perfect carry-it-all bag with space for all of your daily essentials in refined, lightweight leather.",
      isNew: false,
      isFeatured: true,
      inventory: 18,
      sku: "C1434-TN-SD",
    },
    {
      name: "Studio Shoulder Bag",
      price: 450,
      category: "Bags",
      subcategory: "Shoulder Bags",
      gender: "Women",
      collection: "Studio",
      image:
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop",
      description:
        "A timeless style featuring our Signature push-lock closure, the Studio bag is crafted of smooth glove-tanned leather with polished hardware.",
      isNew: false,
      isFeatured: false,
      inventory: 9,
      sku: "C1337-BK-ST",
    },
    {
      name: "Cargo Crossbody Bag",
      price: 350,
      category: "Bags",
      subcategory: "Crossbody Bags",
      gender: "Unisex",
      collection: "Cargo",
      image:
        "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1974&auto=format&fit=crop",
      description:
        "A utility-inspired crossbody with multiple compartments, crafted for everyday ease and modern city living.",
      isNew: true,
      isFeatured: false,
      inventory: 22,
      sku: "C0987-OL-XB",
    },
    {
      name: "Heritage Zip Top Tote",
      price: 495,
      compareAtPrice: 550,
      category: "Bags",
      subcategory: "Totes",
      gender: "Women",
      collection: "Heritage",
      image:
        "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1915&auto=format&fit=crop",
      description:
        "A spacious zip-top tote in rich glove-tanned leather, sized perfectly for work, travel, and everything in between.",
      isNew: false,
      isFeatured: false,
      inventory: 7,
      sku: "C0412-CM-TT",
    },
    {
      name: "Chelsea Leather Low-Top Sneakers",
      price: 295,
      compareAtPrice: 330,
      category: "Shoes",
      subcategory: "Sneakers",
      gender: "Unisex",
      collection: "Footwear",
      image:
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012&auto=format&fit=crop",
      description:
        "Minimal leather sneakers with a cushioned sole and clean silhouette — a versatile investment piece for every rotation.",
      isNew: true,
      isFeatured: false,
      inventory: 30,
      sku: "C5112-WHT-LW",
    },
    {
      name: "Mercury Lug Boot",
      price: 525,
      category: "Shoes",
      subcategory: "Boots",
      gender: "Women",
      collection: "Footwear",
      image:
        "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=1974&auto=format&fit=crop",
      description:
        "A sturdy lug-sole boot with refined leather uppers, made to carry you through every season in comfort and style.",
      isNew: true,
      isFeatured: false,
      inventory: 12,
      sku: "C5230-BLK-BT",
    },
    {
      name: "Slim Accordion Wallet",
      price: 225,
      category: "Wallets",
      subcategory: "Bifold & Slim",
      gender: "Men",
      collection: null,
      image:
        "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1974&auto=format&fit=crop",
      description:
        "A slim, accordion-style wallet with organized card slots and a secure bill compartment in supple pebble leather.",
      isNew: false,
      isFeatured: false,
      inventory: 25,
      sku: "C7714-BRN-WL",
    },
    {
      name: "Turnlock Card Case",
      price: 145,
      compareAtPrice: 170,
      category: "Wallets",
      subcategory: "Card Cases",
      gender: "Women",
      collection: null,
      image:
        "https://images.unsplash.com/photo-1606503153255-34cc92499e0a?q=80&w=1974&auto=format&fit=crop",
      description:
        "A compact card case with our signature Turnlock closure — fits neatly in smaller bags while keeping everything organized.",
      isNew: false,
      isFeatured: false,
      inventory: 40,
      sku: "C7740-CTN-CC",
    },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        slug: slugify(p.name),
        name: p.name,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        currency: "USD",
        category: p.category,
        subcategory: p.subcategory,
        gender: p.gender,
        collection: p.collection,
        images: [p.image],
        sku: p.sku,
        inventory: p.inventory,
        isNew: p.isNew,
        isFeatured: p.isFeatured,
        status: "ACTIVE",
      },
    });
  }

  // ─── Campaigns ────────────────────────────────────────────────────────────
  await prisma.campaign.createMany({
    data: [
      {
        title: "Shoulder Bags",
        subtitle: "Iconic silhouettes built for daily luxury",
        image: "/shoulder-bags.png",
        link: "/category/women-bags",
        isFeatured: true,
        displayOrder: 1,
      },
      {
        title: "New Shoes",
        subtitle: "Step into modern elegance",
        image:
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012&auto=format&fit=crop",
        link: "/category/shoes",
        isFeatured: false,
        displayOrder: 2,
      },
    ],
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });