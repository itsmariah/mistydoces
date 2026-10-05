-- Horário estruturado: o texto livre antigo vira a observação do horário (sem perder dados).
ALTER TABLE "StoreSettings" RENAME COLUMN "openingHours" TO "hoursNote";

ALTER TABLE "StoreSettings" ADD COLUMN     "weeklyHours" JSONB,
ADD COLUMN     "prepMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "maxAdvanceDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "blockedDates" JSONB NOT NULL DEFAULT '[]';

-- Antecedência por produto: 0 = pronta-entrega.
ALTER TABLE "Product" ADD COLUMN     "leadTimeDays" INTEGER NOT NULL DEFAULT 0;

-- Janela agendada do pedido (nula só nos pedidos antigos).
ALTER TABLE "Order" ADD COLUMN     "scheduledFor" TIMESTAMP(3);

CREATE INDEX "Order_scheduledFor_idx" ON "Order"("scheduledFor");
