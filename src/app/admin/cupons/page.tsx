import { listCouponsAdmin } from "@/services/coupon-service";
import { CouponList } from "@/components/admin/coupon-list";

export default async function AdminCouponsPage() {
  const coupons = await listCouponsAdmin();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <h1 className="font-heading text-2xl font-semibold">Cupons</h1>
      <CouponList coupons={coupons} />
    </div>
  );
}
