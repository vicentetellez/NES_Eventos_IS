ALTER TABLE "evento_utiliza_equipo"
ADD COLUMN "precio_unitario_acordado" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "monto_cobrado" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "detalle_presupuesto"
ADD COLUMN "codigo_equipo" INTEGER;

ALTER TABLE "detalle_presupuesto"
ADD CONSTRAINT "detalle_presupuesto_codigo_equipo_fkey"
FOREIGN KEY ("codigo_equipo") REFERENCES "equipo"("codigo")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "detalle_presupuesto_codigo_equipo_idx"
ON "detalle_presupuesto"("codigo_equipo");

UPDATE "detalle_presupuesto" AS detalle
SET "codigo_equipo" = (
    SELECT MIN(equipo."codigo")
    FROM "equipo" AS equipo
    WHERE regexp_replace(detalle."descripcion", ' \(estimado por [0-9]+ horas\)$', '') = equipo."nombre"
)
WHERE detalle."categoria" = 'EQUIPAMIENTO'
  AND detalle."codigo_equipo" IS NULL
  AND (
      SELECT COUNT(*)
      FROM "equipo" AS equipo
      WHERE regexp_replace(detalle."descripcion", ' \(estimado por [0-9]+ horas\)$', '') = equipo."nombre"
  ) = 1;
