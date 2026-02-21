-- Script para arreglar tipos de datos en tabla estaciones
-- Ejecutar con: psql -U postgres -d db_datanew -f fix_estaciones.sql

-- Arreglar altura_suelo
ALTER TABLE estaciones
  ALTER COLUMN altura_suelo TYPE DOUBLE PRECISION
  USING CASE
    WHEN altura_suelo ~ '^[0-9]+\.?[0-9]*$' THEN altura_suelo::double precision
    ELSE NULL
  END;

-- Arreglar lat
ALTER TABLE estaciones
  ALTER COLUMN lat TYPE DOUBLE PRECISION
  USING CASE
    WHEN lat ~ '^-?[0-9]+\.?[0-9]*$' THEN lat::double precision
    ELSE NULL
  END;

-- Arreglar lon
ALTER TABLE estaciones
  ALTER COLUMN lon TYPE DOUBLE PRECISION
  USING CASE
    WHEN lon ~ '^-?[0-9]+\.?[0-9]*$' THEN lon::double precision
    ELSE NULL
  END;

-- Verificar cambios
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'estaciones'
  AND column_name IN ('altura_suelo', 'lat', 'lon');
