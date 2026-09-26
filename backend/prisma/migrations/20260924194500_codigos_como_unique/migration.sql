/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `categoria` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre]` on the table `equipo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre]` on the table `especialidad` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[codigo_evaluacion]` on the table `evento` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "evento" ALTER COLUMN "codigo_evaluacion" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "estado" SET DEFAULT 'SOLICITADO';

-- AlterTable
ALTER TABLE "persona" ALTER COLUMN "fecha_nacimiento" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nombre_key" ON "categoria"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "equipo_nombre_key" ON "equipo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "especialidad_nombre_key" ON "especialidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "evento_codigo_evaluacion_key" ON "evento"("codigo_evaluacion");
