-- AlterTable
ALTER TABLE "detalle_presupuesto" ADD COLUMN "es_arriendo_tercero" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "presupuesto" DROP COLUMN "porcentaje_margen";
