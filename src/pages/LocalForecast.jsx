import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import stationService from '../services/stationService';
import mlService from '../services/mlService';
import {
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning,
  CloudDrizzle, CloudFog, CloudSun, CloudRainWind,
  Wind, Droplets, Thermometer, MapPin, Brain,
  Loader2, AlertCircle, CheckCircle, ChevronDown,
  TrendingUp, Umbrella, Zap, RefreshCw, X,
  Radio,
} from 'lucide-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// ── Weather icons ────────────────────────────────────────────────────────────

function WeatherIcon({ name, size = 'h-12 w-12' }) {
  const cls = size;
  switch (name) {
    case 'sun':            return <Sun           className={`${cls} text-yellow-500`} />;
    case 'cloud-sun':      return <CloudSun      className={`${cls} text-yellow-400`} />;
    case 'cloud':          return <Cloud         className={`${cls} text-gray-400`} />;
    case 'cloud-rain':     return <CloudRain     className={`${cls} text-blue-500`} />;
    case 'cloud-drizzle':  return <CloudDrizzle  className={`${cls} text-blue-400`} />;
    case 'cloud-snow':     return <CloudSnow     className={`${cls} text-blue-200`} />;
    case 'cloud-lightning':return <CloudLightning className={`${cls} text-purple-500`} />;
    case 'cloud-fog':      return <CloudFog      className={`${cls} text-gray-300`} />;
    case 'cloud-rain-wind':return <CloudRainWind className={`${cls} text-blue-600`} />;
    default:               return <Cloud         className={`${cls} text-gray-400`} />;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function probColor(p) {
  if (p >= 70) return 'bg-blue-500';
  if (p >= 50) return 'bg-blue-400';
  if (p >= 30) return 'bg-blue-300';
  return 'bg-blue-200';
}

function probTextColor(p) {
  if (p >= 70) return 'text-blue-600';
  if (p >= 50) return 'text-blue-500';
  if (p >= 30) return 'text-blue-400';
  return 'text-gray-500';
}

function uvColor(uv) {
  if (uv >= 8) return { bg: 'bg-red-50',    text: 'text-red-600',    icon: 'text-red-500' };
  if (uv >= 6) return { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'text-orange-500' };
  if (uv >= 3) return { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'text-yellow-600' };
  return         { bg: 'bg-green-50',  text: 'text-green-600',  icon: 'text-green-600' };
}

// ── Day card ─────────────────────────────────────────────────────────────────

function DayCard({ day, selected, onClick }) {
  const uvc = day.uv_index != null ? uvColor(day.uv_index) : null;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-all cursor-pointer hover:shadow-xl hover:scale-[1.02] ${
        selected
          ? 'border-purple-500 ring-2 ring-purple-200'
          : day.is_today
          ? 'border-blue-400 ring-2 ring-blue-200'
          : 'border-gray-200'
      }`}
    >
      {/* Day header */}
      <div className={`px-4 py-3 text-center ${
        selected ? 'bg-purple-500 text-white' :
        day.is_today ? 'bg-blue-500 text-white' : 'bg-gray-50'
      }`}>
        <p className={`font-bold text-lg capitalize ${
          selected || day.is_today ? 'text-white' : 'text-gray-800'
        }`}>{day.label}</p>
        <p className={`text-sm ${
          selected ? 'text-purple-100' : day.is_today ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {new Date(day.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
        </p>
      </div>

      {/* Icon */}
      <div className="flex justify-center py-4">
        <div className="transition-transform hover:scale-110 hover:-translate-y-1">
          <WeatherIcon name={day.weather_icon} />
        </div>
      </div>

      {/* Description */}
      <p className="text-center text-sm text-gray-600 px-2 mb-3 line-clamp-2 min-h-[40px]">
        {day.weather_description}
      </p>

      {/* Temp max / min */}
      <div className="flex justify-center items-center gap-3 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-red-500">
            {day.temp_max != null ? `${Math.round(day.temp_max)}°` : '--'}
          </p>
          <p className="text-xs text-gray-500">Máx</p>
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-500">
            {day.temp_min != null ? `${Math.round(day.temp_min)}°` : '--'}
          </p>
          <p className="text-xs text-gray-500">Mín</p>
        </div>
      </div>

      {/* Rain probability */}
      <div className="px-4 pb-4">
        <div className="bg-gray-100 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <Umbrella className={`h-4 w-4 ${probTextColor(day.rain_probability)}`} />
              <span className="text-xs text-gray-600">Prob. lluvia</span>
            </div>
            <span className={`font-bold ${probTextColor(day.rain_probability)}`}>
              {day.rain_probability}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${probColor(day.rain_probability)}`}
              style={{ width: `${day.rain_probability}%` }}
            />
          </div>
        </div>
      </div>

      {/* Extra info rows */}
      <div className="px-3 pb-3 space-y-1.5">
        {day.wind_speed != null && (
          <div className="group flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:shadow-sm transition-all">
            <Wind className="h-4 w-4 text-gray-400 group-hover:rotate-12 group-hover:scale-125 transition-transform" />
            <span className="text-xs text-gray-500 flex-1">Viento</span>
            <span className="text-xs font-semibold text-gray-700">{Math.round(day.wind_speed)} km/h</span>
          </div>
        )}

        {day.apparent_temp_min != null && day.apparent_temp_max != null && (
          <div className="group flex items-center gap-2 p-2 rounded-lg bg-orange-50 hover:shadow-sm transition-all">
            <Thermometer className="h-4 w-4 text-orange-400 group-hover:scale-125 transition-transform" />
            <span className="text-xs text-gray-500 flex-1">Sensación Térmica</span>
            <span className="text-xs font-semibold text-orange-700">
              {day.apparent_temp_min}° - {day.apparent_temp_max}°
            </span>
          </div>
        )}

        {day.humidity_min != null && day.humidity_max != null && (
          <div className="group flex items-center gap-2 p-2 rounded-lg bg-blue-50 hover:shadow-sm transition-all">
            <Droplets className="h-4 w-4 text-blue-500 group-hover:scale-125 transition-transform" />
            <span className="text-xs text-gray-500 flex-1">Humedad</span>
            <span className="text-xs font-semibold text-blue-700">
              {day.humidity_min}-{day.humidity_max}%
            </span>
          </div>
        )}

        {day.uv_index != null && uvc && (
          <div className={`group flex items-center gap-2 p-2 rounded-lg ${uvc.bg} hover:shadow-sm transition-all`}>
            <Sun className={`h-4 w-4 ${uvc.icon} group-hover:scale-125 group-hover:rotate-45 transition-transform`} />
            <span className="text-xs text-gray-500 flex-1">Índice UV</span>
            <span className={`text-xs font-semibold ${uvc.text}`}>{day.uv_index.toFixed(1)}</span>
          </div>
        )}

        {day.solar_rad != null && (
          <div className="group flex items-center gap-2 p-2 rounded-lg bg-amber-50 hover:shadow-sm transition-all">
            <Sun className="h-4 w-4 text-amber-500 group-hover:scale-125 transition-transform" />
            <span className="text-xs text-gray-500 flex-1">Radiación</span>
            <span className="text-xs font-semibold text-amber-700">{Math.round(day.solar_rad)} W/m²</span>
          </div>
        )}

        {day.precipitation != null && day.precipitation > 0 && (
          <div className="group flex items-center gap-2 p-2 rounded-lg bg-indigo-50 hover:shadow-sm transition-all">
            <CloudRain className="h-4 w-4 text-blue-500 group-hover:scale-125 transition-transform" />
            <span className="text-xs text-gray-500 flex-1">Precipitación</span>
            <span className="text-xs font-semibold text-blue-700">{day.precipitation.toFixed(1)} mm</span>
          </div>
        )}

        {day.eto != null && (
          <div className="group flex items-center gap-2 p-2 rounded-lg bg-emerald-50 hover:shadow-sm transition-all">
            <Droplets className="h-4 w-4 text-emerald-500 group-hover:scale-125 transition-transform" />
            <span className="text-xs text-gray-500 flex-1">ETo</span>
            <span className="text-xs font-semibold text-emerald-700">{day.eto.toFixed(1)} mm</span>
          </div>
        )}
      </div>

      {/* Expand chevron */}
      <div className={`text-center pb-3 ${selected ? 'text-purple-500' : 'text-gray-400'}`}>
        <ChevronDown className={`h-5 w-5 mx-auto transition-transform ${selected ? 'rotate-180' : ''}`} />
      </div>
    </div>
  );
}

// ── Hourly charts panel ───────────────────────────────────────────────────────

function HourlyCharts({ day, onClose }) {
  if (!day?.hourly_data?.length) return null;

  const hd     = day.hourly_data;
  const labels = hd.map(p => p.time);

  const combinedOpts = {
    title:   { text: '' },
    credits: { enabled: false },
    chart:   { height: 420 },
    xAxis:   { categories: labels, crosshair: true },
    yAxis: [
      // 0 — temperatura °C (izquierda)
      { title: { text: '°C', style: { color: '#ef4444' } }, labels: { style: { color: '#ef4444' } } },
      // 1 — porcentaje 0-100 (derecha): humedad + prob lluvia
      { title: { text: '%', style: { color: '#3b82f6' } }, labels: { style: { color: '#3b82f6' } }, opposite: true, min: 0, max: 100 },
      // 2 — viento km/h (izquierda, offset)
      { title: { text: 'km/h', style: { color: '#14b8a6' } }, labels: { style: { color: '#14b8a6' } }, opposite: false },
      // 3 — radiación W/m² (derecha, offset)
      { title: { text: 'W/m²', style: { color: '#f59e0b' } }, labels: { style: { color: '#f59e0b' } }, opposite: true, min: 0 },
    ],
    tooltip:  { shared: true },
    legend:   { enabled: true },
    plotOptions: { spline: { marker: { enabled: true, radius: 4 } } },
    series: [
      { name: 'Temperatura',       data: hd.map(p => p.temp),           type: 'spline', yAxis: 0, color: '#ef4444', zIndex: 5 },
      { name: 'Sensación Térmica', data: hd.map(p => p.apparent_temp),  type: 'spline', yAxis: 0, color: '#f97316', dashStyle: 'ShortDash', zIndex: 4 },
      { name: 'Humedad',           data: hd.map(p => p.humidity),       type: 'area',   yAxis: 1, color: '#3b82f6', fillOpacity: 0.15, zIndex: 2 },
      { name: 'Prob. Lluvia',      data: hd.map(p => p.rain_probability), type: 'spline', yAxis: 1, color: '#8b5cf6', dashStyle: 'ShortDot', zIndex: 3 },
      { name: 'Viento',            data: hd.map(p => p.wind_speed),     type: 'spline', yAxis: 2, color: '#14b8a6', zIndex: 3 },
      { name: 'Radiación Solar',   data: hd.map(p => p.solar_rad),      type: 'area',   yAxis: 3, color: '#f59e0b', fillOpacity: 0.10, zIndex: 1 },
    ],
  };

  const fullDate = new Date(day.date + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-fadeIn">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <TrendingUp className="h-6 w-6" />
          <div>
            <h3 className="text-xl font-bold">Pronóstico por Hora</h3>
            <p className="text-purple-100 capitalize">{fullDate}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
          <X className="h-6 w-6 text-white" />
        </button>
      </div>

      <div className="p-6">
        <HighchartsReact highcharts={Highcharts} options={combinedOpts} />
      </div>

    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function LocalForecast() {
  const { user } = useAuth();
  const [stations, setStations]               = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [forecast, setForecast]               = useState(null);   // DayForecastResponse
  const [loading, setLoading]                 = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [training, setTraining]               = useState(false);
  const [mlStatus, setMlStatus]               = useState(null);
  const [error, setError]                     = useState('');
  const [selectedDay, setSelectedDay]         = useState(null);

  // Health check
  useEffect(() => {
    mlService.health()
      .then(r => setMlStatus(r.data.ml_service))
      .catch(() => setMlStatus('down'));
  }, []);

  // Load stations
  useEffect(() => {
    if (!user?.username) return;
    stationService.getByUsername(user.username)
      .then(r => {
        setStations(r.data || []);
        if (r.data?.length > 0) {
          setSelectedStation(r.data[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const fetchForecast = async (station = selectedStation) => {
    if (!station) return;
    setLoadingForecast(true);
    setError('');
    setForecast(null);
    setSelectedDay(null);
    try {
      const res = await mlService.predict(station.id_estacion);
      setForecast(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || e.response?.data?.error || 'Error al obtener predicción');
    } finally {
      setLoadingForecast(false);
    }
  };

  const handleTrain = async () => {
    if (!selectedStation) return;
    setTraining(true);
    setError('');
    try {
      const res = await mlService.train(selectedStation.id_estacion);
      if (res.data.success) {
        await fetchForecast();
      } else {
        setError(res.data.message || 'Error al entrenar el modelo');
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al entrenar el modelo');
    } finally {
      setTraining(false);
    }
  };

  const handleStationChange = (e) => {
    const s = stations.find(st => st.id_estacion === e.target.value);
    if (s) { setSelectedStation(s); setForecast(null); setError(''); setSelectedDay(null); }
  };

  const handleDayClick = (day) => {
    setSelectedDay(prev => prev?.date === day.date ? null : day);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pronóstico Local ML</h1>
          <p className="text-gray-600 mt-1">
            Predicción de 7 días con Machine Learning para tus estaciones
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {mlStatus === 'up' && (
            <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full font-medium">
              <CheckCircle className="h-3.5 w-3.5" /> Modelo activo
            </span>
          )}
          {mlStatus === 'down' && (
            <span className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full font-medium">
              <AlertCircle className="h-3.5 w-3.5" /> Modelo no disponible
            </span>
          )}

          <Radio className="h-5 w-5 text-purple-600" />
          <select
            className="input-field min-w-[250px]"
            value={selectedStation?.id_estacion || ''}
            onChange={handleStationChange}
          >
            <option value="">Seleccionar estación...</option>
            {stations.map(s => (
              <option key={s.id_estacion} value={s.id_estacion}>
                {s.nombre_estacion} - {s.ciudad}
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchForecast()}
            disabled={loadingForecast || training || !selectedStation || mlStatus === 'down'}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
          >
            {loadingForecast ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Predecir
          </button>

          <button
            onClick={handleTrain}
            disabled={training || loadingForecast || !selectedStation || mlStatus === 'down'}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all"
            title="Re-entrenar modelo con datos históricos"
          >
            <RefreshCw className={`h-4 w-4 ${training ? 'animate-spin' : ''}`} />
            {training ? 'Entrenando...' : 'Re-entrenar'}
          </button>
        </div>
      </div>

      {/* ML down warning */}
      {mlStatus === 'down' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          El microservicio ML no está disponible. Inícialo con:&nbsp;
          <code className="bg-red-100 px-1 rounded">uvicorn main:app --host 0.0.0.0 --port 5001</code>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* No stations */}
      {stations.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No tienes estaciones</h3>
          <p className="text-gray-500">Crea una estación para usar el pronóstico local ML</p>
        </div>
      )}

      {/* Station card */}
      {selectedStation && (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <MapPin className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedStation.nombre_estacion}</h2>
                <p className="text-purple-100">
                  {selectedStation.localidad ? `${selectedStation.localidad}, ` : ''}
                  {selectedStation.ciudad}{selectedStation.pais ? `, ${selectedStation.pais}` : ''}
                </p>
                {selectedStation.lat != null && (
                  <p className="text-purple-200 text-sm mt-0.5">
                    Coordenadas: {selectedStation.lat}, {selectedStation.lon}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
              <Brain className="h-10 w-10 text-white/80" />
              <div>
                <p className="text-lg font-bold">ML Random Forest</p>
                <p className="text-purple-100 text-sm">7 días · datos históricos</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hint */}
      {!loadingForecast && forecast?.days?.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          <p className="text-purple-700 text-sm">
            Haz clic en cualquier día para ver las gráficas detalladas por hora
          </p>
        </div>
      )}

      {/* Loading */}
      {loadingForecast && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
          <span className="ml-3 text-gray-600">Generando pronóstico ML…</span>
        </div>
      )}

      {/* Day cards */}
      {!loadingForecast && forecast?.days?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {forecast.days.map(day => (
            <DayCard
              key={day.date}
              day={day}
              selected={selectedDay?.date === day.date}
              onClick={() => handleDayClick(day)}
            />
          ))}
        </div>
      )}

      {/* Hourly charts */}
      {selectedDay && (
        <HourlyCharts day={selectedDay} onClose={() => setSelectedDay(null)} />
      )}

      {/* Rain legend */}
      {!loadingForecast && forecast?.days?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Leyenda de probabilidad de lluvia</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-200 inline-block" /> Baja (0–29%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-300 inline-block" /> Moderada (30–49%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" /> Alta (50–69%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Muy alta (70–100%)</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loadingForecast && !forecast && !error && selectedStation && (
        <div className="text-center py-16 text-gray-400">
          <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            Presiona <strong>Predecir</strong> para generar el pronóstico de 7 días
          </p>
          <p className="text-sm mt-1">
            El modelo se entrena automáticamente la primera vez
          </p>
        </div>
      )}

    </div>
  );
}
