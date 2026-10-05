import { Clock, MapPin } from "lucide-react";
import { HoursList } from "@/components/shared/hours-list";
import type { PickupInfo } from "@/lib/store-contact";
import { cn } from "@/lib/utils";

/** Endereço de retirada (com link para o mapa) e horário — checkout, pedido e contato. */
export function PickupDetails({ pickup, className }: { pickup: PickupInfo; className?: string }) {
  return (
    <div className={cn("space-y-3 text-sm", className)}>
      <div className="flex gap-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-link" aria-hidden="true" />
        <div>
          {pickup.addressLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <a
            href={pickup.mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link underline-offset-4 hover:underline"
          >
            Ver no mapa
          </a>
        </div>
      </div>
      <div className="flex gap-2">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-link" aria-hidden="true" />
        <HoursList hours={pickup.hours} />
      </div>
    </div>
  );
}
