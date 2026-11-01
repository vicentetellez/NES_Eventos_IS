/*
  Warnings:

  - A unique constraint covering the columns `[codigo_evaluacion]` on the table `evento` will be added. If there are existing duplicate values, this will fail.

  Note: los índices únicos de categoria/equipo/especialidad ya fueron creados en la migración 20260923195841, se eliminan de aquí por estar duplicados.
*/
-- AlterTable
ALTER TABLE "evento" ALTER COLUMN "codigo_evaluacion" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "estado" SET DEFAULT 'SOLICITADO';

-- AlterTable
ALTER TABLE "persona" ALTER COLUMN "fecha_nacimiento" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "evento_codigo_evaluacion_key" ON "evento"("codigo_evaluacion");
