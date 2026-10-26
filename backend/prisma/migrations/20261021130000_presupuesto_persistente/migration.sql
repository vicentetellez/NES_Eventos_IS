ALTER TABLE "presupuesto"
DROP COLUMN "porcentaje_beneficio_equipo_externo",
ADD COLUMN "porcentaje_margen" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "observacion_dictamen" TEXT,
ALTER COLUMN "estado" SET DEFAULT 'BORRADOR';

CREATE UNIQUE INDEX "presupuesto_codigo_evento_key" ON "presupuesto"("codigo_evento");

ALTER TABLE "detalle_presupuesto"
ADD COLUMN "codigo_especialidad" INTEGER,
ADD COLUMN "rut_trabajador" VARCHAR(12);
