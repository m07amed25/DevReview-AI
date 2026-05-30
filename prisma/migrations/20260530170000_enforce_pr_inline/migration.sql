-- pr_inline_comments is now enforced in code (post-review-to-github pipeline).
UPDATE "capability" SET "kind" = 'enforced' WHERE "key" = 'pr_inline_comments';
