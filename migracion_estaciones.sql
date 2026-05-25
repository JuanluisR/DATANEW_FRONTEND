-- Migración para agregar nuevos campos a la tabla estaciones
-- Ejecutar en PostgreSQL

-- Agregar columna departamento (reemplaza localidad)
ALTER TABLE estaciones ADD COLUMN IF NOT EXISTS departamento VARCHAR(255);

-- Agregar columna elevacion
ALTER TABLE estaciones ADD COLUMN IF NOT EXISTS elevacion DOUBLE PRECISION;

-- Opcional: Copiar datos de localidad a departamento si existe
UPDATE estaciones SET departamento = localidad WHERE departamento IS NULL AND localidad IS NOT NULL;

-- Verificar columnas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'estaciones' 
AND column_name IN ('departamento', 'elevacion', 'localidad', 'altura_suelo');
