-- Los valores históricos fueron almacenados como UTC en columnas sin zona.
-- AT TIME ZONE 'UTC' conserva ese instante al convertirlos a TIMESTAMPTZ.
ALTER TABLE "cliente"
  ALTER COLUMN "fecha_registro" TYPE TIMESTAMPTZ(3)
  USING "fecha_registro" AT TIME ZONE 'UTC';

ALTER TABLE "trabajador"
  ALTER COLUMN "fecha_registro" TYPE TIMESTAMPTZ(3)
  USING "fecha_registro" AT TIME ZONE 'UTC';

ALTER TABLE "usuario"
  ALTER COLUMN "ultimo_acceso" TYPE TIMESTAMPTZ(3)
  USING "ultimo_acceso" AT TIME ZONE 'UTC',
  ALTER COLUMN "fecha_registro" TYPE TIMESTAMPTZ(3)
  USING "fecha_registro" AT TIME ZONE 'UTC';