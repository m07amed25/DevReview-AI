-- custom_review_rules is now enforced in code (rules.create), so reflect that in the catalog.
UPDATE "capability" SET "kind" = 'enforced' WHERE "key" = 'custom_review_rules';
