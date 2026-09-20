/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `banqueteria` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre]` on the table `centro_evento` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre]` on the table `tipo_evento` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "banqueteria_nombre_key" ON "banqueteria"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "centro_evento_nombre_key" ON "centro_evento"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_evento_nombre_key" ON "tipo_evento"("nombre");
