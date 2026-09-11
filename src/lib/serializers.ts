import { formatPrice, toNumber } from "./money";

export interface SerializedProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  priceLabel: string;
  compareAtPrice: number | null;
  compareAtPriceLabel: string | null;
  currency: string;
  category: string;
  subcategory: string | null;
  gender: string;
  collection: string | null;
  image: string;
  images: string[];
  sku: string | null;
  inventory: number;
  isNew: boolean;
  isFeatured: boolean;
  status: string;
  createdAt: string;
}

export function serializeProduct(row: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: { toNumber(): number } | number | string;
  compareAtPrice: { toNumber(): number } | number | string | null;
  currency: string;
  category: string;
  subcategory: string | null;
  gender: string;
  collection: string | null;
  images: string[];
  sku: string | null;
  inventory: number;
  isNew: boolean;
  isFeatured: boolean;
  status: string;
  createdAt: Date;
}): SerializedProduct {
  const price = typeof row.price === "object" && row.price ? row.price.toNumber() : toNumber(row.price);
  const compare =
    row.compareAtPrice === null
      ? null
      : typeof row.compareAtPrice === "object" && row.compareAtPrice
        ? row.compareAtPrice.toNumber()
        : toNumber(row.compareAtPrice);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price,
    priceLabel: formatPrice(price, row.currency),
    compareAtPrice: compare,
    compareAtPriceLabel: compare === null ? null : formatPrice(compare, row.currency),
    currency: row.currency,
    category: row.category,
    subcategory: row.subcategory,
    gender: row.gender,
    collection: row.collection,
    image: row.images[0] ?? "",
    images: row.images,
    sku: row.sku,
    inventory: row.inventory,
    isNew: row.isNew,
    isFeatured: row.isFeatured,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}