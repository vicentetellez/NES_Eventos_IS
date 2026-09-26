-- Remove dependent records when an event is deleted.
ALTER TABLE "evento_utiliza_equipo" DROP CONSTRAINT "evento_utiliza_equipo_codigo_evento_fkey";
ALTER TABLE "evento_utiliza_equipo" ADD CONSTRAINT "evento_utiliza_equipo_codigo_evento_fkey" FOREIGN KEY ("codigo_evento") REFERENCES "evento"("codigo") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evento_tiene_banqueteria" DROP CONSTRAINT "evento_tiene_banqueteria_codigo_evento_fkey";
ALTER TABLE "evento_tiene_banqueteria" ADD CONSTRAINT "evento_tiene_banqueteria_codigo_evento_fkey" FOREIGN KEY ("codigo_evento") REFERENCES "evento"("codigo") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trabajador_participa_evento" DROP CONSTRAINT "trabajador_participa_evento_codigo_evento_fkey";
ALTER TABLE "trabajador_participa_evento" ADD CONSTRAINT "trabajador_participa_evento_codigo_evento_fkey" FOREIGN KEY ("codigo_evento") REFERENCES "evento"("codigo") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "presupuesto" DROP CONSTRAINT "presupuesto_codigo_evento_fkey";
ALTER TABLE "presupuesto" ADD CONSTRAINT "presupuesto_codigo_evento_fkey" FOREIGN KEY ("codigo_evento") REFERENCES "evento"("codigo") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "detalle_presupuesto" DROP CONSTRAINT "detalle_presupuesto_codigo_presupuesto_fkey";
ALTER TABLE "detalle_presupuesto" ADD CONSTRAINT "detalle_presupuesto_codigo_presupuesto_fkey" FOREIGN KEY ("codigo_presupuesto") REFERENCES "presupuesto"("codigo") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evaluacion_evento" DROP CONSTRAINT "evaluacion_evento_codigo_evento_fkey";
ALTER TABLE "evaluacion_evento" ADD CONSTRAINT "evaluacion_evento_codigo_evento_fkey" FOREIGN KEY ("codigo_evento") REFERENCES "evento"("codigo") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evaluacion_trabajador" DROP CONSTRAINT "evaluacion_trabajador_codigo_evento_fkey";
ALTER TABLE "evaluacion_trabajador" ADD CONSTRAINT "evaluacion_trabajador_codigo_evento_fkey" FOREIGN KEY ("codigo_evento") REFERENCES "evento"("codigo") ON DELETE CASCADE ON UPDATE CASCADE;