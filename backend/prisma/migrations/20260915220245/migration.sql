-- CreateTable
CREATE TABLE "region" (
    "codigo" SERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,

    CONSTRAINT "region_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "comuna" (
    "codigo" SERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "codigo_region" INTEGER NOT NULL,

    CONSTRAINT "comuna_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "persona" (
    "rut" VARCHAR(12) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "primer_apellido" VARCHAR(200) NOT NULL,
    "segundo_apellido" VARCHAR(200),
    "fecha_nacimiento" DATE NOT NULL,
    "telefono" VARCHAR(20) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "has_soft_delete" BOOLEAN NOT NULL DEFAULT false,
    "codigo_comuna" INTEGER NOT NULL,

    CONSTRAINT "persona_pkey" PRIMARY KEY ("rut")
);

-- CreateTable
CREATE TABLE "cliente" (
    "rut" VARCHAR(12) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("rut")
);

-- CreateTable
CREATE TABLE "trabajador" (
    "rut" VARCHAR(12) NOT NULL,
    "es_externo" BOOLEAN NOT NULL DEFAULT false,
    "sueldo" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "trabajador_pkey" PRIMARY KEY ("rut")
);

-- CreateTable
CREATE TABLE "usuario" (
    "rut" VARCHAR(12) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "rol" VARCHAR(50) NOT NULL,
    "ultimo_acceso" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("rut")
);

-- CreateIndex
CREATE UNIQUE INDEX "persona_email_key" ON "persona"("email");

-- AddForeignKey
ALTER TABLE "comuna" ADD CONSTRAINT "comuna_codigo_region_fkey" FOREIGN KEY ("codigo_region") REFERENCES "region"("codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona" ADD CONSTRAINT "persona_codigo_comuna_fkey" FOREIGN KEY ("codigo_comuna") REFERENCES "comuna"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_rut_fkey" FOREIGN KEY ("rut") REFERENCES "persona"("rut") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajador" ADD CONSTRAINT "trabajador_rut_fkey" FOREIGN KEY ("rut") REFERENCES "persona"("rut") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_rut_fkey" FOREIGN KEY ("rut") REFERENCES "persona"("rut") ON DELETE CASCADE ON UPDATE CASCADE;
