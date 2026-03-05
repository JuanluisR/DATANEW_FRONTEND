import { useState, useEffect } from 'react';
import { X, Radio, Gauge, MapPin, Hash, Activity, TrendingUp, Thermometer, Droplets, Wind, Sun, CloudRain, AlertCircle } from 'lucide-react';
import exDataService from '../../services/exDataService';

const formatValue = (value, decimals = 1) => {
  if (value === null || value === undefined || value === 'NaN' || value === '' || isNaN(value)) {
    return null;
  }
  return Number(value).toFixed(decimals);
};

const getTimeAgo = (dateString) => {
  if (!dateString) return '';
  const dateStr = dateString.includes('Z') || dateString.match(/[+-]\d{2}:\d{2}$/)
    ? dateString
    : dateString + 'Z';
  const reportDate = new Date(dateStr);
  const now = new Date();
  const diffMs = now - reportDate;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMinutes < 1) return 'Reportó hace menos de 1 minuto';
  if (diffMinutes < 60) return `Reportó hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `Reportó hace ${diffHours} hora${diffHours !== 1 ? 's' : ''} y ${diffMinutes % 60} min`;
  if (diffDays === 1) return 'Reportó hace 1 día';
  return `Reportó hace ${diffDays} días`;
};

const SENSOR_DISPLAY = {
  temperature:   { icon: Thermometer, color: 'text-green-600',  bg: 'bg-green-50',   label: 'Temperatura',     suffix: '°C'   },
  temperatura:   { icon: Thermometer, color: 'text-green-600',  bg: 'bg-green-50',   label: 'Temperatura',     suffix: '°C'   },
  humidity:      { icon: Droplets,    color: 'text-blue-600',   bg: 'bg-blue-50',    label: 'Humedad',         suffix: '%'    },
  humedad:       { icon: Droplets,    color: 'text-blue-600',   bg: 'bg-blue-50',    label: 'Humedad',         suffix: '%'    },
  wind:          { icon: Wind,        color: 'text-teal-600',   bg: 'bg-teal-50',    label: 'Viento',          suffix: 'km/h' },
  viento:        { icon: Wind,        color: 'text-teal-600',   bg: 'bg-teal-50',    label: 'Viento',          suffix: 'km/h' },
  rain:          { icon: CloudRain,   color: 'text-indigo-600', bg: 'bg-indigo-50',  label: 'Precipitación',   suffix: 'mm'   },
  lluvia:        { icon: CloudRain,   color: 'text-indigo-600', bg: 'bg-indigo-50',  label: 'Precipitación',   suffix: 'mm'   },
  precipitacion: { icon: CloudRain,   color: 'text-indigo-600', bg: 'bg-indigo-50',  label: 'Precipitación',   suffix: 'mm'   },
  solar:         { icon: Sun,         color: 'text-yellow-600', bg: 'bg-yellow-50',  label: 'Radiación Solar', suffix: 'W/m²' },
  radiacion:     { icon: Sun,         color: 'text-yellow-600', bg: 'bg-yellow-50',  label: 'Radiación Solar', suffix: 'W/m²' },
};

const SensorDetailModal = ({ sensor, station, isOpen, onClose }) => {
  const [exData, setExData] = useState(null);
  const [loadingExData, setLoadingExData] = useState(false);

  useEffect(() => {
    if (!isOpen || !sensor?.id_sensor) {
      setExData(null);
      return;
    }
    setLoadingExData(true);
    exDataService.getLatestBySensor(sensor.id_sensor)
      .then(res => setExData(res.data))
      .catch(() => setExData(null))
      .finally(() => setLoadingExData(false));
  }, [isOpen, sensor?.id_sensor]);

  if (!isOpen || !sensor) return null;

  const tipoKey = (sensor.tipo_sensor || '').toLowerCase().trim();
  const displayConfig = SENSOR_DISPLAY[tipoKey] || null;
  const Icon = displayConfig?.icon || Activity;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">{sensor.nombre_sensor}</h2>
              <p className="text-emerald-100 text-sm">ID: {sensor.id_sensor || sensor.sensor_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Información del sensor */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              Información del Sensor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Radio className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-gray-400 text-xs">Tipo</p>
                  <p className="font-medium">{sensor.tipo_sensor}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Gauge className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-gray-400 text-xs">ID Sensor</p>
                  <p className="font-medium">{sensor.id_sensor || '—'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-gray-400 text-xs">Modelo</p>
                  <p className="font-medium">{sensor.model_sensor || '—'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-gray-400 text-xs">Canal</p>
                  <p className="font-medium">{sensor.canal ?? '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estación asociada */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Radio className="h-5 w-5 text-green-600" />
              Estación Asociada
            </h3>
            {station ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Nombre</p>
                  <p className="font-medium">{station.nombre_estacion}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">ID</p>
                  <p className="font-medium">{station.id_estacion}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Ubicación</p>
                  <p className="font-medium">{station.ciudad}, {station.departamento}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Coordenadas</p>
                  <p className="font-medium">{station.lat}, {station.lon}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No hay estación asociada</p>
            )}
          </div>

          {/* Datos actuales del sensor desde ex_data */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Datos Actuales del Sensor
            </h3>

            {loadingExData ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : exData ? (
              <>
                <div className="flex justify-center">
                  <div className={`${displayConfig?.bg || 'bg-emerald-50'} rounded-2xl p-8 text-center min-w-[200px]`}>
                    <Icon className={`h-12 w-12 mx-auto mb-3 ${displayConfig?.color || 'text-emerald-600'}`} />
                    <p className={`text-4xl font-bold ${displayConfig?.color || 'text-emerald-600'}`}>
                      {formatValue(exData.value, 1) ?? '—'}
                      <span className="text-2xl ml-1">
                        {exData.unit || displayConfig?.suffix || ''}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {displayConfig?.label || sensor.tipo_sensor || 'Valor'}
                    </p>
                  </div>
                </div>
                {exData.report_date && (
                  <p className="text-xs text-gray-400 mt-4 text-center">
                    Última actualización: {getTimeAgo(exData.report_date)}
                  </p>
                )}
              </>
            ) : !sensor.id_sensor ? (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-4">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">Este sensor no tiene un ID configurado. Edítalo para asignar un ID.</p>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">Sin datos registrados</p>
                <p className="text-xs mt-1 font-mono text-gray-400">{sensor.id_sensor}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorDetailModal;
