CREATE SEQUENCE "evento_numero_visible_seq";
ALTER TABLE "evento" ADD COLUMN "numero_visible" INTEGER;
ALTER TABLE "evento" ALTER COLUMN "numero_visible" SET DEFAULT nextval('evento_numero_visible_seq');
ALTER SEQUENCE "evento_numero_visible_seq" OWNED BY "evento"."numero_visible";
CREATE UNIQUE INDEX "evento_numero_visible_key" ON "evento"("numero_visible");

ALTER TABLE "presupuesto" ADD COLUMN "rut_usuario_creador" VARCHAR(12);
ALTER TABLE "presupuesto" ADD CONSTRAINT "presupuesto_rut_usuario_creador_fkey"
  FOREIGN KEY ("rut_usuario_creador") REFERENCES "usuario"("rut") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "comprobante_abono" (
  "codigo" SERIAL PRIMARY KEY,
  "codigo_evento" INTEGER NOT NULL,
  "contenido" BYTEA NOT NULL,
  "tipo" VARCHAR(50) NOT NULL,
  "estado" VARCHAR(20) NOT NULL,
  "observacion" TEXT,
  "fecha_carga" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_revision" TIMESTAMPTZ(3),
  "rut_usuario_carga" VARCHAR(12) NOT NULL,
  "rut_usuario_revision" VARCHAR(12),
  CONSTRAINT "comprobante_abono_estado_check" CHECK ("estado" IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
  CONSTRAINT "comprobante_abono_tipo_check" CHECK ("tipo" IN ('image/png', 'application/pdf')),
  CONSTRAINT "comprobante_abono_codigo_evento_fkey" FOREIGN KEY ("codigo_evento") REFERENCES "evento"("codigo") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "comprobante_abono_rut_usuario_carga_fkey" FOREIGN KEY ("rut_usuario_carga") REFERENCES "usuario"("rut") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "comprobante_abono_rut_usuario_revision_fkey" FOREIGN KEY ("rut_usuario_revision") REFERENCES "usuario"("rut") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "comprobante_abono_codigo_evento_key" ON "comprobante_abono"("codigo_evento");
