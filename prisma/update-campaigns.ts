import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Updating Neon DB campaign records...");
  
  // Update or recreate campaigns in Neon DB so Shoulder Bags uses /shoulder-bags.png
  await prisma.campaign.deleteMany();

  await prisma.campaign.createMany({
    data: [
      {
        title: "Shoulder Bags",
        subtitle: "Iconic silhouettes built for daily luxury",
        image: "/shoulder-bags.png",
        link: "#",
        isFeatured: true,
        displayOrder: 1,
      },
      {
        title: "New Shoes",
        subtitle: "Step into modern elegance",
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012&auto=format&fit=crop",
        link: "#",
        isFeatured: false,
        displayOrder: 2,
      },
    ],
  });

  console.log("Neon DB updated successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
