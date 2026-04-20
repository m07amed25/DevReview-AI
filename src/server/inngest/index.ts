export { inngest } from "./client";
export { reviewPR } from "./functions/review-pr";
export { postReviewToGitHub } from "./functions/post-review-to-github";
export {
  dailyScheduledScan,
  weeklyScheduledScan,
  handleScanCompleted,
} from "./functions/scheduled-scan";

import { reviewPR } from "./functions/review-pr";
import { postReviewToGitHub } from "./functions/post-review-to-github";
import {
  dailyScheduledScan,
  weeklyScheduledScan,
  handleScanCompleted,
} from "./functions/scheduled-scan";

export const functions = [
  reviewPR,
  postReviewToGitHub,
  dailyScheduledScan,
  weeklyScheduledScan,
  handleScanCompleted,
];
