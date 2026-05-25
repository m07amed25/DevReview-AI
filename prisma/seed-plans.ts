import { PrismaClient } from "../src/server/db/client";

const db = new PrismaClient();

const plans = [
  {
    id: "free",
    name: "Free",
    tagline: "Perfect for individuals and small side projects.",
    monthlyPrice: 0,
    features: ["Up to 3 private repositories", "50 AI Reviews per month", "Basic Security Scanning"],
    reposLimit: 3,
    reviewsLimit: 50,
    seatsLimit: 1,
    privateRepos: false,
    sortOrder: 0,
    accentColor: "indigo",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For professionals and growing teams.",
    monthlyPrice: 19,
    features: ["20 repositories", "500 AI Reviews per month", "Advanced Security Scanning", "Team collaboration", "Priority support"],
    reposLimit: 20,
    reviewsLimit: 500,
    seatsLimit: 10,
    privateRepos: true,
    sortOrder: 1,
    accentColor: "violet",
  },
  {
    id: "ultra",
    name: "Ultra",
    tagline: "Unlimited scale. Total confidence.",
    monthlyPrice: 59,
    features: ["50 repositories", "500 AI reviews", "Full AI analysis suite", "All repo types", "24/7 dedicated support + SLA", "50 team seats", "SSO / SAML", "Advanced analytics"],
    reposLimit: 50,
    reviewsLimit: 500,
    seatsLimit: 50,
    privateRepos: true,
    sortOrder: 2,
    accentColor: "amber",
  },
];

async function main() {
  for (const plan of plans) {
    await db.pricingPlan.upsert({
      where: { id: plan.id },
      create: plan,
      update: plan,
    });
  }
  console.log("✓ Pricing plans seeded.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
