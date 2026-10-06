import Image from "next/image";
import { STORE_TIME_ZONE, greetingFor } from "@/lib/store-time";

const todayFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: STORE_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function DashboardGreeting({ name, now }: { name: string; now: Date }) {
  const firstName = name.trim().split(/\s+/)[0] || name;

  return (
    <div className="flex items-center gap-4">
      <Image
        src="/branding/23_gatinha_chef_rostinho.png"
        alt=""
        width={64}
        height={64}
        className="size-14 shrink-0 object-contain sm:size-16 dark:brightness-95"
      />
      <div className="min-w-0">
        <p className="font-display text-xl text-script first-letter:uppercase">
          {todayFormatter.format(now)}
        </p>
        <h1 className="font-heading text-2xl font-semibold text-balance">
          {greetingFor(now)}, {firstName}!
        </h1>
      </div>
    </div>
  );
}
