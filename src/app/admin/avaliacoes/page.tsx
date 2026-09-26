import { can } from "@/lib/permissions";
import { requirePagePermission } from "@/lib/require-permission";
import { adminListReviews } from "@/services/review-service";
import { ReviewList } from "@/components/admin/review-list";

export default async function AdminReviewsPage() {
  const user = await requirePagePermission("reviews:view");
  const reviews = await adminListReviews();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <h1 className="font-heading text-2xl font-semibold">Avaliações</h1>
      <ReviewList reviews={reviews} canModerate={can(user.role, "reviews:moderate")} />
    </div>
  );
}
