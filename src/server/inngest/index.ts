export { inngest } from "./client";
export { reviewPR } from "./functions/review-pr";
export { postReviewToGitHub } from "./functions/post-review-to-github";
export {
  dailyScheduledScan,
  weeklyScheduledScan,
  handleScanCompleted,
} from "./functions/scheduled-scan";
export { generateDiagram } from "./functions/generate-diagram";

import { reviewPR } from "./functions/review-pr";
import { postReviewToGitHub } from "./functions/post-review-to-github";
import {
  dailyScheduledScan,
  weeklyScheduledScan,
  handleScanCompleted,
} from "./functions/scheduled-scan";
import { generateDiagram } from "./functions/generate-diagram";

export const functions = [
  reviewPR,
  postReviewToGitHub,
  dailyScheduledScan,
  weeklyScheduledScan,
  handleScanCompleted,
  generateDiagram,
];
