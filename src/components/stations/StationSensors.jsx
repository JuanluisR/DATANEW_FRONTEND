import { Activity, MapPin, Gauge, Radio, Eye, Clock } from 'lucide-react';

const timeAgo = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString.includes('Z') || dateString.match(/[+-]\d{2}:\d{2}$/) ? dateString : dateString + 'Z');
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
};

const StationSensors = ({ sensors, stations, stationStats, onSensorClick }) => {
  if (!sensors || sensors.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
        <Activity className="h-7 w-7 mr-2 text-emerald-600" />
        Mis Sensores
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sensors.map((sensor) => {
          const station = stations.find(s => s.id_estacion === sensor.id_estacion);
          const stats = stationStats?.[sensor.id_estacion];
          const ago = timeAgo(stats?.reportDate);
          return (
            <div key={sensor.sensor_id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-emerald-200 overflow-hidden">
              <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-700">Sensor</span>
                </div>
                {sensor.tipo_sensor && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {sensor.tipo_sensor}
                  </span>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-bold text-xl text-gray-900 uppercase mb-3">{sensor.nombre_sensor}</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Activity className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Tipo</p>
                      <p className="font-semibold text-gray-700 text-sm">{sensor.tipo_sensor || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Gauge className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">ID Sensor</p>
                      <p className="font-semibold text-gray-700 text-sm">{sensor.id_sensor || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Radio className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Modelo</p>
                      <p className="font-semibold text-gray-700 text-sm">{sensor.model_sensor || '—'}</p>
                    </div>
                  </div>
                  {station && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Estación</p>
                        <p className="font-semibold text-gray-700 text-sm">{station.nombre_estacion}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Último envío */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-400">Último envío:</span>
                  {ago ? (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {ago}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>

                <button
                  onClick={() => onSensorClick(sensor)}
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>Detalles</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StationSensors;
