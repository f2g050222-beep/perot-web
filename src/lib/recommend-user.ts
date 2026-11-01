/* 带穿着反馈的推荐入口：原 recommend() + 反馈调整层 */
import { SHOES, SHOE_DATA_VERSION } from "@/data/shoes";
import { recommend, RULE_VERSION } from "./matching";
import { feedbackRepo } from "./feedback-store";
import { adjustProfileByFeedback, feedbackScoreHook } from "./feedback-adjust";
import { getCurrentUserId } from "./user-session";
import type { UserProfile } from "./types";

export function recommendForUser(profile: UserProfile) {
  const fbs = feedbackRepo.listByUser(getCurrentUserId());
  const result = recommend(adjustProfileByFeedback(profile, fbs), SHOES, {
    ruleVersion: RULE_VERSION,
    shoeDataVersion: SHOE_DATA_VERSION,
    adjust: feedbackScoreHook(fbs, SHOES),
  });
  return { result, feedbackCount: fbs.length };
}
