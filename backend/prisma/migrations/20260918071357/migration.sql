/*
  Warnings:

  - You are about to drop the column `fecha_registro` on the `persona` table. All the data in the column will be lost.
  - You are about to drop the column `has_soft_delete` on the `persona` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cliente" ADD COLUMN     "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "persona" DROP COLUMN "fecha_registro",
DROP COLUMN "has_soft_delete";

-- AlterTable
ALTER TABLE "trabajador" ADD COLUMN     "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "debe_cambiar_password" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "ultimo_acceso" SET DEFAULT CURRENT_TIMESTAMP;
