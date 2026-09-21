import type { ReactNode } from "react";
import { SiteLayout } from "@/components/shared/site-layout";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return <SiteLayout>{children}</SiteLayout>;
}
