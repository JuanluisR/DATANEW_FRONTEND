import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import stationService from '../services/stationService';
import forecastService from '../services/forecastService';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  CloudSun,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  Radio,
  Loader2,
  AlertCircle,
  CloudRainWind,
  Umbrella,
  ChevronDown,
  X,
  TrendingUp,
  Compass,
  Sprout
} from 'lucide-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const WIND_DIR_MAP = {
  'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
  'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
  'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
  'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
};

const Forecasts = () => {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    if (user?.username) {
      fetchStations();
    }
  }, [user]);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await stationService.getByUsername(user.username);
      setStations(response.data);

      if (response.data.length > 0) {
        const firstStation = response.data[0];
        setSelectedStation(firstStation);
        fetchForecast(firstStation.lat, firstStation.lon);
      }
    } catch (err) {
      console.error('Error fetching stations:', err);
      setError('Error al cargar las estaciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async (lat, lon) => {
    try {
      setLoadingForecast(true);
      setError('');
      setSelectedDay(null);

      if (lat === null || lat === undefined || lon === null || lon === undefined) {
        setError('La estación no tiene coordenadas configuradas');
        setForecast([]);
        return;
      }

      // Check if coordinates are valid
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        console.error('Invalid coordinates:', { lat, lon });
        setError(`Coordenadas inválidas para esta estación (lat: ${lat}, lon: ${lon}). Por favor, edita la estación en la página de Estaciones y actualiza las coordenadas al formato decimal correcto (ej: lat: 10.4806, lon: -66.9036). Las coordenadas deben estar entre -90 y 90 para latitud, y -180 y 180 para longitud.`);
        setForecast([]);
        return;
      }

      const response = await forecastService.getForecast(lat, lon);
      setForecast(response.data || []);
    } catch (err) {
      console.error('Error fetching forecast:', err);
      setError('Error al cargar el pronóstico. Verifica las coordenadas de la estación.');
      setForecast([]);
    } finally {
      setLoadingForecast(false);
    }
  };

  const handleStationChange = (e) => {
    const stationId = e.target.value;
    const station = stations.find(s => s.id_estacion === stationId || s.id.toString() === stationId);
    if (station) {
      setSelectedStation(station);
      fetchForecast(station.lat, station.lon);
    }
  };

  const handleDayClick = (day, index) => {
    if (selectedDay?.date === day.date) {
      setSelectedDay(null); // Toggle off if clicking same day
    } else {
      setSelectedDay({ ...day, index });
    }
  };

  const getWeatherIcon = (iconName, size = 'h-12 w-12') => {
    const iconClass = `${size}`;
    switch (iconName) {
      case 'sun':
        return <Sun className={`${iconClass} text-yellow-500`} />;
      case 'cloud-sun':
        return <CloudSun className={`${iconClass} text-yellow-400`} />;
      case 'cloud':
        return <Cloud className={`${iconClass} text-gray-400`} />;
      case 'cloud-rain':
        return <CloudRain className={`${iconClass} text-blue-500`} />;
      case 'cloud-drizzle':
        return <CloudDrizzle className={`${iconClass} text-blue-400`} />;
      case 'cloud-snow':
        return <CloudSnow className={`${iconClass} text-blue-200`} />;
      case 'cloud-lightning':
        return <CloudLightning className={`${iconClass} text-purple-500`} />;
      case 'cloud-fog':
        return <CloudFog className={`${iconClass} text-gray-300`} />;
      case 'cloud-rain-wind':
        return <CloudRainWind className={`${iconClass} text-blue-600`} />;
      default:
        return <Cloud className={`${iconClass} text-gray-400`} />;
    }
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 70) return 'bg-blue-500';
    if (probability >= 50) return 'bg-blue-400';
    if (probability >= 30) return 'bg-blue-300';
    return 'bg-blue-200';
  };

  const getProbabilityTextColor = (probability) => {
    if (probability >= 70) return 'text-blue-600';
    if (probability >= 50) return 'text-blue-500';
    if (probability >= 30) return 'text-blue-400';
    return 'text-gray-500';
  };

  const getDayName = (dateString, isToday) => {
    if (isToday) return 'Hoy';
    const date = new Date(dateString + 'T00:00:00');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return 'Mañana';
    return date.toLocaleDateString('es-ES', { weekday: 'long' });
  };

  const getWindDirection = (degrees) => {
    if (!degrees) return null;
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const formatFullDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
              {entry.name.includes('Temperatura') || entry.name.includes('Sensación') ? '°C' : ''}
              {entry.name.includes('Humedad') || entry.name.includes('Prob') ? '%' : ''}
              {entry.name.includes('Viento') ? ' km/h' : ''}
              {entry.name.includes('Precipitación') && !entry.name.includes('Prob') ? ' mm' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pronóstico del Tiempo</h1>
          <p className="text-gray-600 mt-1">Pronóstico de 7 días para tus estaciones</p>
        </div>

        {/* Station Selector */}
        <div className="flex items-center gap-3">
          <Radio className="h-5 w-5 text-primary-600" />
          <select
            className="input-field min-w-[250px]"
            value={selectedStation?.id_estacion || selectedStation?.id || ''}
            onChange={handleStationChange}
          >
            <option value="">Seleccionar estación...</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id_estacion || station.id}>
                {station.nombre_estacion} - {station.ciudad}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* No Stations Message */}
      {stations.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <Radio className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No tienes estaciones</h3>
          <p className="text-gray-500">Crea una estación para ver el pronóstico del tiempo</p>
        </div>
      )}

      {/* Selected Station Info */}
      {selectedStation && (
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <MapPin className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedStation.nombre_estacion}</h2>
                <p className="text-blue-100">
                  {selectedStation.localidad && `${selectedStation.localidad}, `}
                  {selectedStation.ciudad}, {selectedStation.pais}
                </p>
                <p className="text-blue-200 text-sm mt-1">
                  Coordenadas: {selectedStation.lat}, {selectedStation.lon}
                </p>
              </div>
            </div>

            {/* Current Weather (if available) */}
            {forecast.length > 0 && forecast[0].currentTemp !== undefined && (
              <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4">
                {getWeatherIcon(forecast[0].weatherIcon, 'h-16 w-16')}
                <div>
                  <p className="text-4xl font-bold">{Math.round(forecast[0].currentTemp)}°C</p>
                  <p className="text-blue-100">{forecast[0].weatherDescription}</p>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {forecast[0].currentUvIndex !== undefined && forecast[0].currentUvIndex !== null && (
                    <div className="flex items-center gap-1 text-xs text-blue-100">
                      <Sun className="h-3 w-3" />
                      <span>UV: {forecast[0].currentUvIndex?.toFixed(1)}</span>
                    </div>
                  )}
                  {forecast[0].currentSolarRadiation !== undefined && forecast[0].currentSolarRadiation !== null && (
                    <div className="flex items-center gap-1 text-xs text-blue-100">
                      <Sun className="h-3 w-3" />
                      <span>Radiación: {Math.round(forecast[0].currentSolarRadiation)} W/m²</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Forecast */}
      {loadingForecast && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          <span className="ml-3 text-gray-600">Cargando pronóstico...</span>
        </div>
      )}

      {/* Instruction */}
      {!loadingForecast && forecast.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          <p className="text-blue-700 text-sm">Haz clic en cualquier día para ver las gráficas detalladas por hora</p>
        </div>
      )}

      {/* Forecast Cards */}
      {!loadingForecast && forecast.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {forecast.map((day, index) => (
            <div
              key={day.date}
              onClick={() => handleDayClick(day, index)}
              className={`bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-all cursor-pointer hover:shadow-xl hover:scale-[1.02] ${
                selectedDay?.date === day.date
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : day.isToday
                  ? 'border-blue-400 ring-2 ring-blue-200'
                  : 'border-gray-200'
              }`}
            >
              {/* Day Header */}
              <div className={`px-4 py-3 text-center ${
                selectedDay?.date === day.date
                  ? 'bg-primary-500 text-white'
                  : day.isToday
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-50'
              }`}>
                <p className={`font-bold text-lg capitalize ${
                  selectedDay?.date === day.date || day.isToday ? 'text-white' : 'text-gray-800'
                }`}>
                  {getDayName(day.date, day.isToday)}
                </p>
                <p className={`text-sm ${
                  selectedDay?.date === day.date ? 'text-primary-100' : day.isToday ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </p>
              </div>

              {/* Weather Icon */}
              <div className="flex justify-center py-4">
                <div className="transition-transform duration-300 hover:scale-110 hover:-translate-y-1">
                  {getWeatherIcon(day.weatherIcon)}
                </div>
              </div>

              {/* Weather Description */}
              <p className="text-center text-sm text-gray-600 px-2 mb-3 line-clamp-2 min-h-[40px]">
                {day.weatherDescription}
              </p>

              {/* Temperature */}
              <div className="flex justify-center items-center gap-3 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">
                    {day.tempMax !== null ? Math.round(day.tempMax) : '--'}°
                  </p>
                  <p className="text-xs text-gray-500">Máx</p>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">
                    {day.tempMin !== null ? Math.round(day.tempMin) : '--'}°
                  </p>
                  <p className="text-xs text-gray-500">Mín</p>
                </div>
              </div>

              {/* Precipitation Probability */}
              <div className="px-4 pb-4">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <Umbrella className={`h-4 w-4 ${getProbabilityTextColor(day.precipitationProbability)}`} />
                      <span className="text-xs text-gray-600">Prob. lluvia</span>
                    </div>
                    <span className={`font-bold ${getProbabilityTextColor(day.precipitationProbability)}`}>
                      {day.precipitationProbability}%
                    </span>
                  </div>
                  {/* Probability Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getProbabilityColor(day.precipitationProbability)}`}
                      style={{ width: `${day.precipitationProbability}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Additional Info - Vertical Layout */}
              <div className="px-3 pb-3 space-y-1.5">
                {/* Wind Speed */}
                {day.windSpeed !== null && (
                  <div className={`group flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:shadow-sm ${day.windSpeed > 30 ? 'bg-teal-50' : 'bg-gray-50'}`}>
                    <Wind className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12 ${day.windSpeed > 30 ? 'text-teal-600' : 'text-gray-400'}`} />
                    <span className="text-xs text-gray-500 flex-1">Viento</span>
                    <span className={`text-xs font-semibold ${day.windSpeed > 30 ? 'text-teal-700' : 'text-gray-700'}`}>
                      {Math.round(day.windSpeed)} km/h
                    </span>
                  </div>
                )}

                {/* Wind Direction */}
                {day.windDirection != null && !isNaN(day.windDirection) && (
                  <div className="group flex items-center gap-2 p-2 rounded-lg bg-gray-50 transition-all duration-200 hover:shadow-sm">
                    <Compass
                      className="h-4 w-4 flex-shrink-0 text-gray-500 transition-transform duration-300 group-hover:scale-125"
                      style={{ transform: `rotate(${day.windDirection}deg)` }}
                    />
                    <span className="text-xs text-gray-500 flex-1">Dirección</span>
                    <span className="text-xs font-semibold text-gray-700">{day.windDirection}° {getWindDirection(day.windDirection)}</span>
                  </div>
                )}

                {/* Sensación Térmica */}
                {day.hourlyData && (() => {
                  const apparent = day.hourlyData.map(h => h.apparentTemperature).filter(v => v !== null && v !== undefined);
                  if (apparent.length === 0) return null;
                  const minA = Math.round(Math.min(...apparent));
                  const maxA = Math.round(Math.max(...apparent));
                  return (
                    <div className="group flex items-center gap-2 p-2 rounded-lg bg-orange-50 transition-all duration-200 hover:shadow-sm">
                      <Thermometer className="h-4 w-4 flex-shrink-0 text-orange-400 transition-transform duration-200 group-hover:scale-125" />
                      <span className="text-xs text-gray-500 flex-1">Sensación Térmica</span>
                      <span className="text-xs font-semibold text-orange-700">{minA}° - {maxA}°</span>
                    </div>
                  );
                })()}

                {/* Humidity */}
                {day.humidityMax !== null && (
                  <div className="group flex items-center gap-2 p-2 rounded-lg bg-blue-50 transition-all duration-200 hover:shadow-sm">
                    <Droplets className="h-4 w-4 flex-shrink-0 text-blue-500 transition-transform duration-200 group-hover:scale-125 group-hover:-translate-y-0.5" />
                    <span className="text-xs text-gray-500 flex-1">Humedad</span>
                    <span className="text-xs font-semibold text-blue-700">{day.humidityMin}-{day.humidityMax}%</span>
                  </div>
                )}

                {/* UV Index */}
                {day.uvIndex !== null && (
                  <div className={`group flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:shadow-sm ${
                    day.uvIndex >= 8 ? 'bg-red-50' :
                    day.uvIndex >= 6 ? 'bg-orange-50' :
                    day.uvIndex >= 3 ? 'bg-yellow-50' : 'bg-green-50'
                  }`}>
                    <Sun className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-45 ${
                      day.uvIndex >= 8 ? 'text-red-500' :
                      day.uvIndex >= 6 ? 'text-orange-500' :
                      day.uvIndex >= 3 ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                    <span className="text-xs text-gray-500 flex-1">Índice UV</span>
                    <span className={`text-xs font-semibold ${
                      day.uvIndex >= 8 ? 'text-red-600' :
                      day.uvIndex >= 6 ? 'text-orange-600' :
                      day.uvIndex >= 3 ? 'text-yellow-700' : 'text-green-600'
                    }`}>{day.uvIndex.toFixed(1)}</span>
                  </div>
                )}

                {/* Solar Radiation */}
                {day.solarRadiation !== null && !isNaN(day.solarRadiation) && (
                  <div className="group flex items-center gap-2 p-2 rounded-lg bg-amber-50 transition-all duration-200 hover:shadow-sm">
                    <Sun className="h-4 w-4 flex-shrink-0 text-amber-500 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-45" />
                    <span className="text-xs text-gray-500 flex-1">Radiación</span>
                    <span className="text-xs font-semibold text-amber-700">{Math.round(day.solarRadiation)} W/m²</span>
                  </div>
                )}

                {/* Precipitation */}
                {day.precipitation > 0 && (
                  <div className="group flex items-center gap-2 p-2 rounded-lg bg-indigo-50 transition-all duration-200 hover:shadow-sm">
                    <CloudRain className="h-4 w-4 flex-shrink-0 text-blue-500 transition-transform duration-200 group-hover:scale-125 group-hover:-translate-y-0.5" />
                    <span className="text-xs text-gray-500 flex-1">Precipitación</span>
                    <span className="text-xs font-semibold text-blue-700">{day.precipitation.toFixed(1)} mm</span>
                  </div>
                )}

                {/* ETo - Evapotranspiration */}
                {day.eto !== null && !isNaN(day.eto) && (
                  <div className="group flex items-center gap-2 p-2 rounded-lg bg-emerald-50 transition-all duration-200 hover:shadow-sm">
                    <Sprout className="h-4 w-4 flex-shrink-0 text-emerald-500 transition-transform duration-200 group-hover:scale-125" />
                    <span className="text-xs text-gray-500 flex-1">ETo</span>
                    <span className="text-xs font-semibold text-emerald-700">{day.eto.toFixed(1)} mm</span>
                  </div>
                )}
              </div>

              {/* Click indicator */}
              <div className={`text-center pb-3 transition-all ${
                selectedDay?.date === day.date ? 'text-primary-500' : 'text-gray-400'
              }`}>
                <ChevronDown className={`h-5 w-5 mx-auto transition-transform ${
                  selectedDay?.date === day.date ? 'rotate-180' : ''
                }`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hourly Charts for Selected Day */}
      {selectedDay && selectedDay.hourlyData && selectedDay.hourlyData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-fadeIn">
          {/* Chart Header */}
          <div className="bg-gradient-to-r from-primary-500 to-blue-500 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <TrendingUp className="h-6 w-6" />
              <div>
                <h3 className="text-xl font-bold">Pronóstico por Hora</h3>
                <p className="text-primary-100 capitalize">{formatFullDate(selectedDay.date)}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Temperature Chart */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-red-500" />
                Temperatura
              </h4>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: 'spline', height: 250 },
                  title: { text: '' },
                  xAxis: { categories: selectedDay.hourlyData.map(d => d.time) },
                  yAxis: { title: { text: '°C' } },
                  credits: { enabled: false },
                  plotOptions: {
                    spline: { marker: { enabled: true } }
                  },
                  series: [
                    { name: 'Temperatura', data: selectedDay.hourlyData.map(d => d.temperature), color: '#ef4444' },
                    { name: 'Sensación Térmica', data: selectedDay.hourlyData.map(d => d.apparentTemperature), color: '#f97316' }
                  ]
                }}
              />
            </div>

            {/* Humidity & Precipitation Probability Chart */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                Humedad y Probabilidad de Precipitación
              </h4>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { height: 250 },
                  title: { text: '' },
                  xAxis: { categories: selectedDay.hourlyData.map(d => d.time) },
                  yAxis: [{ title: { text: 'Humedad %' }, min: 0, max: 100 }, { title: { text: 'Prob. %' }, opposite: true, min: 0, max: 100 }],
                  credits: { enabled: false },
                  series: [
                    { name: 'Humedad', data: selectedDay.hourlyData.map(d => d.humidity), type: 'area', fillOpacity: 0.2, color: '#3b82f6' },
                    { name: 'Prob. Precipitación', data: selectedDay.hourlyData.map(d => d.precipitationProbability), yAxis: 1, color: '#8b5cf6' }
                  ]
                }}
              />
            </div>

            {/* Wind Speed & Direction Chart */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Wind className="h-5 w-5 text-teal-500" />
                Viento (Dirección y Velocidad)
              </h4>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { height: 280 },
                  title: { text: '' },
                  xAxis: { categories: selectedDay.hourlyData.map(d => d.time) },
                  yAxis: [{ 
                    title: { text: 'km/h' },
                    min: 0
                  }],
                  credits: { enabled: false },
                  tooltip: {
                    shared: true,
                    useHTML: true,
                    formatter: function() {
                      if (!this.points) return false;
                      const pointIdx = this.points?.[0]?.point?.index ?? this.points?.[0]?.point?.x;
                      const hd = (pointIdx !== undefined && selectedDay.hourlyData[pointIdx]) ? selectedDay.hourlyData[pointIdx] : null;
                      const dateLabel = hd?.time || this.x;
                      let speed = 0;
                      this.points.forEach(p => {
                        if (p.series.name === 'Viento') speed = p.y || 0;
                      });
                      const windDeg = hd?.windDirection ?? null;
                      const DIRS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
                      let cardinal = '-';
                      if (windDeg !== null && !isNaN(windDeg)) {
                        cardinal = DIRS[Math.round(((windDeg % 360) / 22.5)) % 16] || '-';
                      }
                      const dirStr = cardinal !== '-'
                        ? cardinal + (windDeg !== null ? ' · ' + Math.round(windDeg) + '°' : '')
                        : '-';
                      let s = '<div style="font-size:12px;padding:6px 8px;min-width:200px">';
                      s += '<div style="font-weight:700;font-size:13px;color:#1f2937;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #e5e7eb">📅 ' + dateLabel + '</div>';
                      s += '<div style="padding:2px 0"><span style="color:#14b8a6">●</span> <b>Velocidad:</b> ' + speed.toFixed(1) + ' km/h</div>';
                      s += '<div style="padding:2px 0"><span style="color:#0f766e">●</span> <b>Dirección:</b> ' + dirStr + '</div>';
                      s += '</div>';
                      return s;
                    }
                  },
                  plotOptions: {
                    spline: {
                      marker: {
                        enabled: true,
                        radius: 5,
                        fillColor: '#14b8a6',
                        lineColor: '#0f766e',
                        lineWidth: 1,
                        states: { hover: { radius: 7 } }
                      },
                      lineWidth: 2,
                      enableMouseTracking: true,
                      zIndex: 3
                    },
                    scatter: {
                      enableMouseTracking: false,
                      marker: { symbol: 'triangle', radius: 6 }
                    }
                  },
                  series: [
                    { name: 'Viento', data: selectedDay.hourlyData.map(d => d.windSpeed), type: 'spline', color: '#14b8a6', yAxis: 0, zIndex: 3 },
                    {
                      name: 'Dirección',
                      data: selectedDay.hourlyData.map((d, i) => {
                        const deg = d.windDirection;
                        const DIRS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
                        const cardinal = (deg !== null && deg !== undefined && !isNaN(deg))
                          ? (DIRS[Math.round(((deg % 360) / 22.5)) % 16] || null)
                          : null;
                        return {
                          x: i,
                          y: d.windSpeed || 0,
                          windDirection: deg,
                          cardinal: cardinal,
                          marker: {
                            symbol: 'triangle',
                            fillColor: '#0f766e',
                            lineColor: '#0f766e',
                            lineWidth: 1,
                            radius: 6,
                            rotation: deg ? deg : 0
                          }
                        };
                      }),
                      dataLabels: {
                        enabled: true,
                        useHTML: true,
                        formatter: function() {
                          const cardinal = this.point.cardinal || '';
                          const deg = this.point.windDirection;
                          const degStr = (deg !== null && deg !== undefined && !isNaN(deg))
                            ? Math.round(deg) + '°' : '';
                          if (!cardinal && !degStr) return '';
                          return '<div style="text-align:center;font-size:12px;font-weight:bold;color:#0f766e;line-height:1.3;text-shadow:1px 1px 0 white,-1px -1px 0 white,1px -1px 0 white,-1px 1px 0 white">' +
                            cardinal + (degStr ? '<br/><span style="font-size:11px">' + degStr + '</span>' : '') + '</div>';
                        },
                        style: { fontSize: '12px', fontWeight: 'bold', color: '#0f766e', textOutline: '1px white' },
                        y: -32
                      },
                      type: 'scatter',
                      color: '#0f766e',
                      yAxis: 0,
                      zIndex: 2
                    }
                  ]
                }}
              />
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <span className="inline-block w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-teal-700"></span>
                <span>Las flechas indican la dirección del viento con punto cardinal y grados</span>
              </div>
            </div>

            {/* Precipitation & ETo Chart */}
            {selectedDay && selectedDay.eto != null && selectedDay.eto !== undefined && !isNaN(selectedDay.eto) && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Sprout className="h-5 w-5 text-emerald-500" />
                Precipitación y ETo (Evapotranspiración)
              </h4>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { height: 280 },
                  title: { text: '' },
                  xAxis: { categories: selectedDay.hourlyData.map(d => d.time) },
                  yAxis: [{ 
                    title: { text: 'mm' },
                    min: 0
                  }, {
                    title: { text: 'ETo (mm)' },
                    opposite: true,
                    min: 0
                  }],
                  credits: { enabled: false },
                  tooltip: {
                    shared: true,
                    useHTML: true,
                    formatter: function() {
                      if (!this.points) return '';
                      let s = '<b>' + this.x + '</b><br/>';
                      this.points.forEach(point => {
                        if (point.series.name === 'Precipitación') {
                          s += '<span style="color:' + point.color + '">●</span> Precipitación: <b>' + point.y.toFixed(2) + ' mm</b><br/>';
                        } else if (point.series.name === 'ETo') {
                          s += '<span style="color:' + point.color + '">●</span> ETo: <b>' + point.y.toFixed(2) + ' mm</b>';
                        }
                      });
                      return s;
                    }
                  },
                  plotOptions: {
                    column: { borderWidth: 0, borderRadius: 2 },
                    spline: { marker: { enabled: true } }
                  },
                  series: [
                    { name: 'Precipitación', data: selectedDay.hourlyData.map(d => d.precipitation || 0), type: 'column', color: '#3b82f6', yAxis: 0 },
                    { name: 'ETo', data: selectedDay.hourlyData.map(() => {
                      const dailyEto = selectedDay.eto || 0;
                      return dailyEto / 24;
                    }), type: 'spline', color: '#10b981', yAxis: 1 }
                  ]
                }}
              />
            </div>
            )}

            {/* Precipitation only when no ETo */}
            {selectedDay && (selectedDay.eto == null || selectedDay.eto === undefined || isNaN(selectedDay.eto)) && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CloudRain className="h-5 w-5 text-blue-500" />
                Precipitación
              </h4>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { height: 200 },
                  title: { text: '' },
                  xAxis: { categories: selectedDay.hourlyData.map(d => d.time) },
                  yAxis: { 
                    title: { text: 'mm' },
                    min: 0
                  },
                  credits: { enabled: false },
                  tooltip: {
                    formatter: function() {
                      return '<b>' + this.x + '</b><br/><span style="color:' + this.color + '">●</span> Precipitación: <b>' + this.y.toFixed(2) + ' mm</b>';
                    }
                  },
                  plotOptions: {
                    column: { borderWidth: 0, borderRadius: 2 }
                  },
                  series: [
                    { name: 'Precipitación', data: selectedDay.hourlyData.map(d => d.precipitation || 0), type: 'column', color: '#3b82f6' }
                  ]
                }}
              />
            </div>
            )}

            {/* UV Index & Solar Radiation Chart */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Sun className="h-5 w-5 text-yellow-500" />
                Índice UV y Radiación Solar
              </h4>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { height: 280 },
                  title: { text: '' },
                  xAxis: { categories: selectedDay.hourlyData.map(d => d.time) },
                  yAxis: [{ 
                    title: { text: 'UV' },
                    min: 0,
                    opposite: false
                  }, {
                    title: { text: 'W/m²' },
                    opposite: true,
                    min: 0
                  }],
                  credits: { enabled: false },
                  tooltip: {
                    shared: true,
                    useHTML: true,
                    formatter: function() {
                      if (!this.points) return '';
                      let s = '<b>' + this.x + '</b><br/>';
                      this.points.forEach(point => {
                        if (point.series.name === 'Índice UV') {
                          s += '<span style="color:' + point.color + '">●</span> UV: <b>' + (point.y ? point.y.toFixed(1) : 0) + '</b><br/>';
                        } else if (point.series.name === 'Radiación Solar') {
                          s += '<span style="color:' + point.color + '">●</span> Radiación: <b>' + (point.y ? point.y.toFixed(0) : 0) + ' W/m²</b>';
                        }
                      });
                      return s;
                    }
                  },
                  plotOptions: {
                    spline: { marker: { enabled: true } },
                    column: { borderWidth: 0, borderRadius: 2 }
                  },
                  series: [
                    { name: 'Índice UV', data: selectedDay.hourlyData.map(d => d.uvIndex), type: 'spline', color: '#eab308', yAxis: 0 },
                    { name: 'Radiación Solar', data: selectedDay.hourlyData.map(d => d.directRadiation || 0), type: 'column', color: '#f97316', yAxis: 1, fillOpacity: 0.6 }
                  ]
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {!loadingForecast && forecast.length > 0 && !selectedDay && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Leyenda de probabilidad de lluvia</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-200"></div>
              <span className="text-sm text-gray-600">Baja (0-29%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-300"></div>
              <span className="text-sm text-gray-600">Moderada (30-49%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-400"></div>
              <span className="text-sm text-gray-600">Alta (50-69%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm text-gray-600">Muy alta (70-100%)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forecasts;
