-- CreateTable
CREATE TABLE "pricing_plan" (
    "id"           TEXT             NOT NULL,
    "name"         TEXT             NOT NULL,
    "tagline"      TEXT             NOT NULL,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "visible"      BOOLEAN          NOT NULL DEFAULT true,
    "highlight"    BOOLEAN          NOT NULL DEFAULT false,
    "features"     TEXT[]           NOT NULL DEFAULT '{}',
    "reposLimit"   INTEGER,
    "reviewsLimit" INTEGER,
    "seatsLimit"   INTEGER,
    "privateRepos" BOOLEAN          NOT NULL DEFAULT false,
    "sortOrder"    INTEGER          NOT NULL DEFAULT 0,
    "updatedAt"    TIMESTAMP(3)     NOT NULL,

    CONSTRAINT "pricing_plan_pkey" PRIMARY KEY ("id")
);

-- Seed default plans
INSERT INTO "pricing_plan"
  ("id","name","tagline","monthlyPrice","visible","highlight","features","reposLimit","reviewsLimit","seatsLimit","privateRepos","sortOrder","updatedAt")
VALUES
  (
    'free','Free','Zero cost. Real results. Ship today.',0,true,false,
    ARRAY['1 repository','5 AI reviews / month','Basic code analysis','Public repos only','Community support','GitHub integration'],
    1,5,1,false,0,NOW()
  ),
  (
    'pro','Pro','10× faster reviews. Zero blind spots.',24,true,true,
    ARRAY['10 repositories','100 AI reviews / month','Advanced code analysis','Public & private repos','Priority email support','GitHub & GitLab integration','Custom review rules','PR inline comments','Team collaboration (5 seats)'],
    10,100,5,true,1,NOW()
  ),
  (
    'ultra','Ultra','Unlimited scale. Total confidence.',59,true,false,
    ARRAY['Unlimited repositories','Unlimited AI reviews','Full AI analysis suite','All repo types','24/7 dedicated support + SLA','All Git providers','Custom review rules','PR inline comments','Unlimited team seats','SSO / SAML','Advanced analytics','Custom webhooks','Audit logs'],
    NULL,NULL,NULL,true,2,NOW()
  )
ON CONFLICT DO NOTHING;
