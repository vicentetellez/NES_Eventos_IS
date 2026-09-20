-- CreateTable
CREATE TABLE "tipo_evento" (
    "codigo" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "tarifa_hora_base_referencial" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tipo_evento_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "centro_evento" (
    "codigo" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "direccion_exacta" VARCHAR(255),
    "capacidad_personas" INTEGER NOT NULL,
    "nombre_dueno" VARCHAR(100),
    "telefono_dueno" VARCHAR(20),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "centro_evento_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "banqueteria" (
    "codigo" SERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "precio_persona_referencial" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "banqueteria_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "categoria" (
    "codigo" SERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "equipo" (
    "codigo" SERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "es_externo" BOOLEAN NOT NULL DEFAULT false,
    "stock_total" INTEGER,
    "stock_no_disponible" INTEGER DEFAULT 0,
    "proveedor" VARCHAR(100),
    "telefono_proveedor" VARCHAR(20),
    "arriendo_hora_referencial" INTEGER,
    "codigo_categoria" INTEGER NOT NULL,

    CONSTRAINT "equipo_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "especialidad" (
    "codigo" SERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "es_evaluable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "especialidad_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "trabajador_tiene_especialidad" (
    "rut_trabajador" VARCHAR(12) NOT NULL,
    "codigo_especialidad" INTEGER NOT NULL,

    CONSTRAINT "trabajador_tiene_especialidad_pkey" PRIMARY KEY ("rut_trabajador","codigo_especialidad")
);

-- CreateTable
CREATE TABLE "plantilla" (
    "codigo" SERIAL NOT NULL,
    "cantidad_fija" INTEGER,
    "ratio_invitados" INTEGER,
    "codigo_tipo_evento" INTEGER NOT NULL,
    "codigo_equipo" INTEGER,
    "codigo_especialidad" INTEGER,

    CONSTRAINT "plantilla_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "evento" (
    "codigo" SERIAL NOT NULL,
    "codigo_evaluacion" INTEGER NOT NULL,
    "estado" VARCHAR(50) NOT NULL,
    "fecha_evento" DATE NOT NULL,
    "hora_inicio" TIME NOT NULL,
    "horas_evento" INTEGER NOT NULL,
    "horas_montaje_desmontaje" INTEGER,
    "cantidad_personas" INTEGER NOT NULL,
    "fecha_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_pago_abono" TIMESTAMP(3),
    "rut_usuario_pago_abono" VARCHAR(12),
    "fecha_pago_final" TIMESTAMP(3),
    "rut_usuario_pago_final" VARCHAR(12),
    "tipo_evento_cliente" VARCHAR(150),
    "centro_evento_cliente" VARCHAR(300),
    "restricciones_alimentarias" TEXT,
    "comentarios_alcohol" TEXT,
    "comentarios_adicionales" TEXT,
    "codigo_tipo_evento" INTEGER,
    "codigo_centro_evento" INTEGER,
    "rut_cliente" VARCHAR(12) NOT NULL,

    CONSTRAINT "evento_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "evento_utiliza_equipo" (
    "codigo_equipo" INTEGER NOT NULL,
    "codigo_evento" INTEGER NOT NULL,
    "cantidad_usada" INTEGER NOT NULL,

    CONSTRAINT "evento_utiliza_equipo_pkey" PRIMARY KEY ("codigo_equipo","codigo_evento")
);

-- CreateTable
CREATE TABLE "evento_tiene_banqueteria" (
    "codigo_evento" INTEGER NOT NULL,
    "codigo_banquete" INTEGER NOT NULL,
    "cantidad_requerida" INTEGER NOT NULL,

    CONSTRAINT "evento_tiene_banqueteria_pkey" PRIMARY KEY ("codigo_evento","codigo_banquete")
);

-- CreateTable
CREATE TABLE "trabajador_participa_evento" (
    "rut_trabajador" VARCHAR(12) NOT NULL,
    "codigo_especialidad" INTEGER NOT NULL,
    "codigo_evento" INTEGER NOT NULL,
    "minutos_trabajados" INTEGER NOT NULL,
    "tarifa_hora_acordada" INTEGER NOT NULL,

    CONSTRAINT "trabajador_participa_evento_pkey" PRIMARY KEY ("rut_trabajador","codigo_especialidad","codigo_evento")
);

-- CreateTable
CREATE TABLE "presupuesto" (
    "codigo" SERIAL NOT NULL,
    "estado" VARCHAR(100) NOT NULL,
    "fecha_dictamen" TIMESTAMPTZ(3),
    "tarifa_hora_base" INTEGER NOT NULL,
    "porcentaje_beneficio_equipo_externo" INTEGER,
    "total" INTEGER NOT NULL,
    "rut_usuario_dictamen" VARCHAR(12),
    "codigo_evento" INTEGER NOT NULL,

    CONSTRAINT "presupuesto_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "detalle_presupuesto" (
    "codigo" SERIAL NOT NULL,
    "categoria" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "codigo_presupuesto" INTEGER NOT NULL,

    CONSTRAINT "detalle_presupuesto_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "evaluacion_evento" (
    "codigo" SERIAL NOT NULL,
    "calidad_puntualidad" BOOLEAN NOT NULL,
    "calidad_tecnica" BOOLEAN NOT NULL,
    "calidad_atencion" BOOLEAN NOT NULL,
    "fidelidad_presupuesto" BOOLEAN NOT NULL,
    "satisfaccion" BOOLEAN NOT NULL,
    "recomendacion" BOOLEAN NOT NULL,
    "puntaje_total" DECIMAL(4,2) NOT NULL,
    "comentario_adicional" TEXT,
    "fecha_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codigo_evento" INTEGER NOT NULL,

    CONSTRAINT "evaluacion_evento_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "evaluacion_trabajador" (
    "codigo" SERIAL NOT NULL,
    "calificacion" DECIMAL(4,2) NOT NULL,
    "comentario_especifico" TEXT,
    "es_autogenerado" BOOLEAN NOT NULL DEFAULT true,
    "fecha_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codigo_evento" INTEGER NOT NULL,
    "codigo_especialidad" INTEGER NOT NULL,
    "rut_trabajador" VARCHAR(12) NOT NULL,

    CONSTRAINT "evaluacion_trabajador_pkey" PRIMARY KEY ("codigo")
);

-- CreateIndex
CREATE UNIQUE INDEX "evaluacion_evento_codigo_evento_key" ON "evaluacion_evento"("codigo_evento");

-- AddForeignKey
ALTER TABLE "equipo" ADD CONSTRAINT "equipo_codigo_categoria_fkey" FOREIGN KEY ("codigo_categoria") REFERENCES "categoria"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajador_tiene_especialidad" ADD CONSTRAINT "trabajador_tiene_especialidad_rut_trabajador_fkey" FOREIGN KEY ("rut_trabajador") REFERENCES "trabajador"("rut") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajador_tiene_especialidad" ADD CONSTRAINT "trabajador_tiene_especialidad_codigo_especialidad_fkey" FOREIGN KEY ("codigo_especialidad") REFERENCES "especialidad"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantilla" ADD CONSTRAINT "plantilla_codigo_tipo_evento_fkey" FOREIGN KEY ("codigo_tipo_evento") REFERENCES "tipo_evento"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantilla" ADD CONSTRAINT "plantilla_codigo_equipo_fkey" FOREIGN KEY ("codigo_equipo") REFERENCES "equipo"("codigo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantilla" ADD CONSTRAINT "plantilla_codigo_especialidad_fkey" FOREIGN KEY ("codigo_especialidad") REFERENCES "especialidad"("codigo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_codigo_tipo_evento_fkey" FOREIGN KEY ("codigo_tipo_evento") REFERENCES "tipo_evento"("codigo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_codigo_centro_evento_fkey" FOREIGN KEY ("codigo_centro_evento") REFERENCES "centro_evento"("codigo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_rut_cliente_fkey" FOREIGN KEY ("rut_cliente") REFERENCES "cliente"("rut") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_rut_usuario_pago_abono_fkey" FOREIGN KEY ("rut_usuario_pago_abono") REFERENCES "usuario"("rut") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_rut_usuario_pago_final_fkey" FOREIGN KEY ("rut_usuario_pago_final") REFERENCES "usuario"("rut") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_utiliza_equipo" ADD CONSTRAINT "evento_utiliza_equipo_codigo_equipo_fkey" FOREIGN KEY ("codigo_equipo") REFERENCES "equipo"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_utiliza_equipo" ADD CONSTRAINT "evento_utiliza_equipo_codigo_evento_fkey" FOREIGN KEY ("codigo_evento") REFERENCES "evento"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_tiene_banqueteria" ADD CONSTRAINT "evento_tiene_banqueteria_codigo_evento_fkey" FOREIGN KEY ("codigo_evento") REFERENCES "evento"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_tiene_banqueteria" ADD CONSTRAINT "evento_tiene_banqueteria_codigo_banquete_fkey" FOREIGN KEY ("codigo_banquete") REFERENCES "banqueteria"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajador_participa_evento" ADD CONSTRAINT "trabajador_participa_evento_rut_trabajador_fkey" FOREIGN KEY ("rut_trabajador") REFERENCES "trabajador"("rut") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajador_participa_evento" ADD CONSTRAINT "trabajador_participa_evento_codigo_especialidad_fkey" FOREIGN KEY ("codigo_especialidad") REFERENCES "especialidad"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajador_participa_evento" ADD CONSTRAINT "trabajador_participa_evento_codigo_evento_fkey" FOREIGN KEY ("codigo_evento") REFERENCES "evento"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presupuesto" ADD CONSTRAINT "presupuesto_rut_usuario_dictamen_fkey" FOREIGN KEY ("rut_usuario_dictamen") REFERENCES "usuario"("rut") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presupuesto" ADD CONSTRAINT "presupuesto_codigo_evento_fkey" FOREIGN KEY ("codigo_evento") REFERENCES "evento"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_presupuesto" ADD CONSTRAINT "detalle_presupuesto_codigo_presupuesto_fkey" FOREIGN KEY ("codigo_presupuesto") REFERENCES "presupuesto"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion_evento" ADD CONSTRAINT "evaluacion_evento_codigo_evento_fkey" FOREIGN KEY ("codigo_evento") REFERENCES "evento"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion_trabajador" ADD CONSTRAINT "evaluacion_trabajador_codigo_evento_fkey" FOREIGN KEY ("codigo_evento") REFERENCES "evento"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion_trabajador" ADD CONSTRAINT "evaluacion_trabajador_codigo_especialidad_fkey" FOREIGN KEY ("codigo_especialidad") REFERENCES "especialidad"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion_trabajador" ADD CONSTRAINT "evaluacion_trabajador_rut_trabajador_fkey" FOREIGN KEY ("rut_trabajador") REFERENCES "trabajador"("rut") ON DELETE RESTRICT ON UPDATE CASCADE;
