import { useState, useEffect } from 'react';
import { X, Radio, MapPin, MapPinned, Calendar, Thermometer, Droplets, Wind, Gauge, Sun, CloudRain, Activity, TrendingUp } from 'lucide-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const WIND_DIR_MAP = {
  'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
  'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
  'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
  'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
};

const getWindRotation = (dir) => {
  if (!dir) return 0;
  const cleanDir = String(dir).toUpperCase().trim();
  return WIND_DIR_MAP[cleanDir] || 0;
};

const formatValue = (value, decimals = 1) => {
  if (value === null || value === undefined || value === 'NaN' || value === '' || isNaN(value)) {
    return null;
  }
  return Number(value).toFixed(decimals);
};

const parseDateTime = (dateString) => {
  if (!dateString) return null;
  if (dateString.includes('Z') || dateString.match(/[+-]\d{2}:\d{2}$/)) {
    return new Date(dateString);
  }
  return new Date(dateString + 'Z');
};

const getTimeAgo = (dateString) => {
  if (!dateString) return '';
  const reportDate = parseDateTime(dateString);
  if (!reportDate) return '';
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

const StationDetailsModal = ({ station, isOpen, onClose, onGetClimateStats, onGetHistory, onGetSensors }) => {
  const [climateStats, setClimateStats] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [stationSensors, setStationSensors] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSensors, setLoadingSensors] = useState(false);

  useEffect(() => {
    if (isOpen && station) {
      loadData();
    }
  }, [isOpen, station]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const stats = await onGetClimateStats(station.id_estacion);
      setClimateStats(stats);
    } catch (error) {
      console.error('Error al cargar datos climáticos:', error);
      setClimateStats(null);
    } finally {
      setLoadingData(false);
    }

    setLoadingSensors(true);
    try {
      const sensors = await onGetSensors(station.id_estacion);
      setStationSensors(sensors);
    } catch (error) {
      console.error('Error al cargar sensores:', error);
      setStationSensors([]);
    } finally {
      setLoadingSensors(false);
    }

    setLoadingHistory(true);
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      
      const formatLocalDateTime = (date, endOfDay = false) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const time = endOfDay ? '23:59:59' : '00:00:00';
        return `${year}-${month}-${day}T${time}`;
      };
      
      const startDate = formatLocalDateTime(startOfDay, false);
      const endDate = formatLocalDateTime(endOfDay, true);
      
      const history = await onGetHistory(station.id_estacion, startDate, endDate);
      
      if (history && history.length > 0) {
        const processedData = history.map(item => ({
          date: item.wswdat_report_date ? new Date(item.wswdat_report_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
          temp: item.wswdat_temp_c,
          humidity: item.wswdat_relative_humidity,
          pressure: item.wswdat_pressure_rel_hpa,
          windSpeed: item.wswdat_wind_speed_kmh,
          windDir: item.wswdat_wind_dir || item.wswdat_wind_degrees,
          precip: item.wswdat_precip_today_mm,
          solarRad: item.wswdat_solar_rad_wm2,
          uvIndex: item.wswdat_uv_index,
        }));
        setHistoryData(processedData);
      }
    } catch (error) {
      console.error('Error al cargar datos del día:', error);
      setHistoryData([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen || !station) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
          <div className="flex items-center space-x-3">
            <Radio className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">{station.nombre_estacion}</h2>
              <p className="text-green-100 text-sm">ID: {station.id_estacion || station.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-gray-400 text-xs">Coordenadas</p>
                  <p className="font-medium">{station.lat}, {station.lon}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPinned className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-gray-400 text-xs">Ubicación</p>
                  <p className="font-medium">{station.departamento && `${station.departamento}, `}{station.ciudad}</p>
                </div>
              </div>
              {station.freq && (
                <div className="flex items-center space-x-2">
                  <Radio className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-gray-400 text-xs">Frecuencia</p>
                    <p className="font-medium">{station.freq} MHz</p>
                  </div>
                </div>
              )}
              {climateStats?.reportDate && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-gray-400 text-xs">Último Reporte</p>
                    <p className="font-medium">{parseDateTime(climateStats.reportDate)?.toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Thermometer className="h-6 w-6 mr-2 text-blue-600" />
              Datos Climáticos
            </h3>

            {loadingData ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : climateStats ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold text-gray-700 text-sm">DATO MÁS RECIENTE</span>
                  </div>
                  {climateStats.reportDate && (
                    <p className="text-sm text-gray-500">{getTimeAgo(climateStats.reportDate)}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formatValue(climateStats.tempCurrent) && (
                    <div className="group bg-green-50 rounded-xl p-4 text-center border border-green-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                      <Thermometer className="h-6 w-6 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-700">{formatValue(climateStats.tempCurrent)}°C</div>
                      <div className="text-xs text-gray-500 mt-1">Temperatura</div>
                      <div className="flex justify-between text-xs mt-2 text-gray-400">
                        <span>Max: {formatValue(climateStats.tempMax)}°</span>
                        <span>Min: {formatValue(climateStats.tempMin)}°</span>
                      </div>
                    </div>
                  )}

                  {formatValue(climateStats.humidityCurrent) && (
                    <div className="group bg-blue-50 rounded-xl p-4 text-center border border-blue-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                      <Droplets className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-700">{formatValue(climateStats.humidityCurrent)}%</div>
                      <div className="text-xs text-gray-500 mt-1">Humedad</div>
                      <div className="flex justify-between text-xs mt-2 text-gray-400">
                        <span>Max: {formatValue(climateStats.humidityMax)}%</span>
                        <span>Min: {formatValue(climateStats.humidityMin)}%</span>
                      </div>
                    </div>
                  )}

                  {formatValue(climateStats.precipCurrent) && (
                    <div className="group bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                      <CloudRain className="h-6 w-6 text-indigo-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-indigo-700">{formatValue(climateStats.precipCurrent)} mm</div>
                      <div className="text-xs text-gray-500 mt-1">Precipitación</div>
                    </div>
                  )}

                  {formatValue(climateStats.windSpeedCurrent) && (
                    <div className="group bg-teal-50 rounded-xl p-4 text-center border border-teal-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                      <Wind className="h-6 w-6 text-teal-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-teal-700">{formatValue(climateStats.windSpeedCurrent)} km/h</div>
                      <div className="text-xs text-gray-500 mt-1">Velocidad viento</div>
                      <div className="flex justify-between text-xs mt-2 text-gray-400">
                        <span>Max: {formatValue(climateStats.windSpeedMax)}</span>
                        <span>Min: {formatValue(climateStats.windSpeedMin)}</span>
                      </div>
                    </div>
                  )}

                  {formatValue(climateStats.pressureCurrent) && (
                    <div className="group bg-gray-50 rounded-xl p-4 text-center border border-gray-200 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                      <Gauge className="h-6 w-6 text-gray-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-700">{formatValue(climateStats.pressureCurrent)} hPa</div>
                      <div className="text-xs text-gray-500 mt-1">Presión</div>
                    </div>
                  )}

                  {formatValue(climateStats.solarRadCurrent) && (
                    <div className="group bg-yellow-50 rounded-xl p-4 text-center border border-yellow-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                      <Sun className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-amber-600">{formatValue(climateStats.solarRadCurrent)} W/m²</div>
                      <div className="text-xs text-gray-500 mt-1">Radiación Solar</div>
                    </div>
                  )}

                  {(climateStats.windDirCurrent || climateStats.windDegreesCurrent != null) && (
                    <div className="group bg-teal-50 rounded-xl p-4 text-center border border-teal-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                      <Wind className="h-6 w-6 text-teal-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-teal-700">
                        {climateStats.windDirCurrent || ''}
                        {climateStats.windDegreesCurrent != null && (
                          <span className="text-lg ml-1 font-normal text-teal-500">
                            {Math.round(climateStats.windDegreesCurrent)}°
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Dirección viento</div>
                    </div>
                  )}

                  {formatValue(climateStats.dewpointCurrent) && (
                    <div className="group bg-cyan-50 rounded-xl p-4 text-center border border-cyan-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                      <Droplets className="h-6 w-6 text-cyan-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-cyan-700">{formatValue(climateStats.dewpointCurrent)}°C</div>
                      <div className="text-xs text-gray-500 mt-1">Punto Rocío</div>
                    </div>
                  )}

                  {formatValue(climateStats.etoCurrent, 2) && (
                    <div className="group bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                      <Activity className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-emerald-700">{formatValue(climateStats.etoCurrent, 2)} mm</div>
                      <div className="text-xs text-gray-500 mt-1">ETO</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Thermometer className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No hay datos climáticos disponibles</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
              Reportes del Día
            </h3>

            {loadingHistory ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : historyData.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-red-500" />
                    Temperatura y Humedad
                  </h4>
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={{
                      chart: { height: 280 },
                      title: { text: '' },
                      xAxis: { categories: historyData.map(d => d.date) },
                      yAxis: [{ 
                        title: { text: '°C' },
                        opposite: false
                      }, {
                        title: { text: '%' },
                        opposite: true,
                        min: 0,
                        max: 100
                      }],
                      credits: { enabled: false },
                      tooltip: { shared: true },
                      plotOptions: { area: { fillOpacity: 0.15 }, spline: { lineWidth: 2 } },
                      series: [
                        { name: 'Temperatura', data: historyData.map(d => d.temp), type: 'spline', color: '#ef4444' },
                        { name: 'Humedad', data: historyData.map(d => d.humidity), type: 'area', color: '#3b82f6' }
                      ]
                    }}
                  />
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-purple-500" />
                    Presión (hPa)
                  </h4>
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={{
                      chart: { type: 'area', height: 200 },
                      title: { text: '' },
                      xAxis: { categories: historyData.map(d => d.date) },
                      yAxis: { title: { text: 'hPa' } },
                      credits: { enabled: false },
                      series: [{ name: 'Presión', data: historyData.map(d => d.pressure), color: '#8b5cf6' }]
                    }}
                  />
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Sun className="h-5 w-5 text-yellow-500" />
                    Índice UV y Radiación Solar
                  </h4>
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={{
                      chart: { height: 280 },
                      title: { text: '' },
                      xAxis: { categories: historyData.map(d => d.date) },
                      yAxis: [{ title: { text: 'UV' }, min: 0 }, { title: { text: 'W/m²' }, opposite: true, min: 0 }],
                      credits: { enabled: false },
                      tooltip: { shared: true },
                      series: [
                        { name: 'Índice UV', data: historyData.map(d => d.uvIndex), type: 'spline', color: '#eab308' },
                        { name: 'Radiación Solar', data: historyData.map(d => d.solarRad), type: 'area', color: '#f97316' }
                      ]
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No hay reportes del día</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Activity className="h-6 w-6 mr-2 text-purple-600" />
              Sensores de la Estación
            </h3>

            {loadingSensors ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
              </div>
            ) : stationSensors.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-semibold">
                      <tr>
                        <th className="px-4 py-3 text-left">Nombre</th>
                        <th className="px-4 py-3 text-left">Tipo</th>
                        <th className="px-4 py-3 text-left">ID Sensor</th>
                        <th className="px-4 py-3 text-left">Modelo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stationSensors.map((sensor) => (
                        <tr key={sensor.sensor_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{sensor.nombre_sensor}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {sensor.tipo_sensor}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{sensor.id_sensor || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{sensor.model_sensor || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No hay sensores registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationDetailsModal;
