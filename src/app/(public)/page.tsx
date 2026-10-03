import { FeaturedProducts } from "@/components/home/featured-products";
import { CategoryShortcuts } from "@/components/home/category-shortcuts";
import { Hero } from "@/components/home/hero";
import { HeartsDivider } from "@/components/home/section-dividers";
import { HowItWorks } from "@/components/home/how-it-works";
import { Testimonials } from "@/components/home/testimonials";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryShortcuts />
      <HeartsDivider className="mb-12 sm:mb-16" />
      <FeaturedProducts />
      <HowItWorks />
      <Testimonials />
    </>
  );
}
