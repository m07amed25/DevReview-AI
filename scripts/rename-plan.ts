import { PrismaClient } from "../src/server/db/client";

const db = new PrismaClient();

async function main() {
  // Upsert enterprise plan with name "Ultra"
  const result = await db.pricingPlan.upsert({
    where: { id: "enterprise" },
    update: { name: "Ultra" },
    create: {
      id: "enterprise",
      name: "Ultra",
      tagline: "For large teams with advanced needs",
      monthlyPrice: 79,
      visible: true,
      highlight: false,
      features: [
        "Unlimited repositories",
        "Unlimited AI reviews",
        "Unlimited team seats",
        "Private repo support",
        "Advanced analytics",
        "SSO / SAML",
        "Custom webhooks",
        "Audit logs",
        "Dedicated support",
        "99.9% SLA",
      ],
      reposLimit: null,
      reviewsLimit: null,
      seatsLimit: null,
      privateRepos: true,
      sortOrder: 2,
      accentColor: "indigo",
    },
  });
  console.log("Done:", result.id, "->", result.name);
}

main()
  .catch((e) => console.error(e))
  .finally(() => db.$disconnect());
