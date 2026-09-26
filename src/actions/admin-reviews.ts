"use server";

import { revalidatePath } from "next/cache";
import { toActionError } from "@/lib/errors";
import { requirePermission } from "@/lib/require-permission";
import * as reviewService from "@/services/review-service";

type ActionResult = { success: true } | { success: false; error: { code: string; message: string } };

export async function setReviewVisibility(
  reviewId: string,
  isVisible: boolean,
): Promise<ActionResult> {
  try {
    await requirePermission("reviews:moderate");
    await reviewService.adminSetReviewVisibility(reviewId, isVisible);
    revalidatePath("/admin/avaliacoes");
    return { success: true };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function deleteReview(reviewId: string): Promise<ActionResult> {
  try {
    await requirePermission("reviews:moderate");
    await reviewService.adminDeleteReview(reviewId);
    revalidatePath("/admin/avaliacoes");
    return { success: true };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
