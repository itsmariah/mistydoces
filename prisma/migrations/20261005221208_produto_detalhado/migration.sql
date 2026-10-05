-- CreateEnum
CREATE TYPE "Allergen" AS ENUM ('GLUTEN', 'LACTOSE', 'EGGS', 'PEANUTS', 'TREE_NUTS', 'SOY', 'COCONUT', 'ARTIFICIAL_COLORS');

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "allergens" "Allergen"[] DEFAULT ARRAY[]::"Allergen"[],
ADD COLUMN     "allowsNote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ingredients" TEXT,
ADD COLUMN     "mayContainTraces" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notePrompt" TEXT;

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
