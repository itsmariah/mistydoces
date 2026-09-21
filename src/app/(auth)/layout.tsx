import type { ReactNode } from "react";
import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/30 px-4 py-16">
      <Logo />
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}
