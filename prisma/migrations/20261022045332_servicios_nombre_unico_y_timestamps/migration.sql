/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `servicios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "servicios" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "servicios_nombre_key" ON "servicios"("nombre");
