import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import stationService from '../services/stationService';
import dataStationService from '../services/dataStationService';
import subscriptionService from '../services/subscriptionService';
import forecastService from '../services/forecastService';
import alertService from '../services/alertService';
import {
  Cloud, Radio, MapPin, Zap, Star, Sparkles, Crown, Building2,
  Sun, CloudSun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog, CloudRainWind,
  Wind, Droplets, Thermometer, Umbrella, AlertTriangle, Bell, ArrowRight, Loader2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for leaflet + bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const Home = () => {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [stationStats, setStationStats] = useState({});
  const [forecast, setForecast] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (user?.username && !fetchingRef.current) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      setLoading(true);
      const [stationsRes, subscriptionRes, alertsRes] = await Promise.all([
        stationService.getByUsername(user.username),
        subscriptionService.getByUsername(user.username),
        alertService.getActiveByUsername(user.username)
      ]);

      const stationList = stationsRes.data;
      setStations(stationList);
      setSubscription(subscriptionRes.data);
      setActiveAlerts(alertsRes.data || []);

      // Fetch climate stats for all stations
      // Skip stations known to have no climate data (return 404)
      if (stationList.length > 0) {
        const stationsWithData = stationList.filter(s => 
          !['AAAAAAABC', 'COLCOMO12', 'COLBOLMA01'].includes(s.id_estacion)
        );
        const results = await Promise.allSettled(
          stationsWithData.map(s => dataStationService.getClimateStats(s.id_estacion))
        );
        const statsMap = {};
        results.forEach((result, idx) => {
          if (result.status === 'fulfilled' && result.value?.data) {
            statsMap[stationsWithData[idx].id_estacion] = result.value.data;
          }
        });
        setStationStats(statsMap);

        // Fetch forecast for first station with valid coordinates
        const validStation = stationList.find(s => {
          const lat = parseFloat(s.lat);
          const lon = parseFloat(s.lon);
          return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && (lat !== 0 || lon !== 0);
        });
        if (validStation) {
          try {
            const forecastRes = await forecastService.getForecast(validStation.lat, validStation.lon);
            setForecast(forecastRes.data || []);
          } catch (err) {
            console.error('Error fetching forecast:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  // --- Helper functions (reused from Stations.jsx) ---
  const formatValue = (value, decimals = 1) => {
    if (value === null || value === undefined || value === 'NaN' || value === '' || isNaN(value)) return null;
    return Number(value).toFixed(decimals);
  };

  // Convertir fecha UTC del servidor a hora local del navegador
  const parseDateTime = (dateString) => {
    if (!dateString) return null;

    // Si ya tiene indicador de timezone (Z o +/-HH:MM), usar directamente
    if (dateString.includes('Z') || dateString.match(/[+-]\d{2}:\d{2}$/)) {
      return new Date(dateString);
    }

    // Si no tiene timezone, asumir que es UTC y convertir a local
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
    if (diffMinutes < 1) return 'Hace menos de 1 minuto';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffHours < 24) return `Hace ${diffHours}h ${diffMinutes % 60}min`;
    if (diffDays === 1) return 'Hace 1 día';
    return `Hace ${diffDays} días`;
  };

  const getMarkerColor = (reportDate) => {
    if (!reportDate) return 'gray';
    const parsed = parseDateTime(reportDate);
    if (!parsed) return 'gray';
    const diffMs = new Date() - parsed;
    const diffMinutes = diffMs / (1000 * 60);
    if (diffMinutes <= 10) return 'green';
    if (diffMinutes <= 120) return 'orange';
    return 'red';
  };

  const getStatusInfo = (color) => {
    switch (color) {
      case 'green': return { label: 'En línea', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' };
      case 'orange': return { label: 'Retraso', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' };
      case 'red': return { label: 'Sin conexión', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
      default: return { label: 'Sin datos', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' };
    }
  };

  const markerColors = { green: '#22c55e', orange: '#f59e0b', red: '#ef4444', gray: '#9ca3af' };

  const getMarkerIcon = (color) => {
    const fill = markerColors[color] || markerColors.gray;
    return L.divIcon({
      className: '',
      iconSize: [30, 42],
      iconAnchor: [15, 42],
      popupAnchor: [0, -38],
      html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">
        <defs><filter id="s${color}" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/></filter></defs>
        <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.716 23.284 0 15 0z" fill="${fill}" filter="url(#s${color})"/>
        <circle cx="15" cy="14" r="6" fill="white" opacity="0.9"/>
      </svg>`
    });
  };

  // --- Weather icon helper (reused from Forecasts.jsx) ---
  const getWeatherIcon = (iconName, size = 'h-12 w-12') => {
    const iconClass = `${size}`;
    switch (iconName) {
      case 'sun': return <Sun className={`${iconClass} text-yellow-500`} />;
      case 'cloud-sun': return <CloudSun className={`${iconClass} text-yellow-400`} />;
      case 'cloud': return <Cloud className={`${iconClass} text-gray-400`} />;
      case 'cloud-rain': return <CloudRain className={`${iconClass} text-blue-500`} />;
      case 'cloud-drizzle': return <CloudDrizzle className={`${iconClass} text-blue-400`} />;
      case 'cloud-snow': return <CloudSnow className={`${iconClass} text-blue-200`} />;
      case 'cloud-lightning': return <CloudLightning className={`${iconClass} text-purple-500`} />;
      case 'cloud-fog': return <CloudFog className={`${iconClass} text-gray-300`} />;
      case 'cloud-rain-wind': return <CloudRainWind className={`${iconClass} text-blue-600`} />;
      default: return <Cloud className={`${iconClass} text-gray-400`} />;
    }
  };

  const getPlanIcon = (planType) => {
    switch (planType) {
      case 'FREE': return <Zap className="h-5 w-5" />;
      case 'BASIC': return <Star className="h-5 w-5" />;
      case 'PRO': return <Sparkles className="h-5 w-5" />;
      case 'ULTRA': return <Crown className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getPlanColor = (planType) => {
    switch (planType) {
      case 'FREE': return 'bg-gray-100 text-gray-700';
      case 'BASIC': return 'bg-blue-100 text-blue-700';
      case 'PRO': return 'bg-purple-100 text-purple-700';
      case 'ULTRA': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Count online stations
  const onlineStations = stations.filter(s => {
    const stats = stationStats[s.id_estacion];
    return stats?.reportDate && getMarkerColor(stats.reportDate) === 'green';
  }).length;

  // Today's forecast
  const todayForecast = forecast.find(d => d.isToday) || forecast[0];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  const validStations = stations.filter(s => {
    const lat = parseFloat(s.lat);
    const lon = parseFloat(s.lon);
    return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && (lat !== 0 || lon !== 0);
  });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800 rounded-2xl shadow-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <Cloud className="h-10 w-10" />
            </div>
            <div>
<p className="text-primary-100 text-sm">¡Bienvenido de vuelta!</p>
              <h1 className="text-3xl font-bold">
                {user?.first_name || user?.username}
              </h1>
              {user?.empresa && (
                <p className="text-primary-200 text-sm mt-1">{user.empresa}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {subscription && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm ${getPlanColor(subscription.planType)}`}>
                {getPlanIcon(subscription.planType)}
                <span>Plan {subscription.planType}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 text-primary-200 text-xs mb-1">
              <Radio className="h-4 w-4" />
              <span>Estaciones</span>
            </div>
            <p className="text-2xl font-bold">{stations.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-300 text-xs mb-1">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
              <span>En línea</span>
            </div>
            <p className="text-2xl font-bold">{onlineStations}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-300 text-xs mb-1">
              <Bell className="h-4 w-4" />
              <span>Alertas Activas</span>
            </div>
            <p className="text-2xl font-bold">{activeAlerts.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-300 text-xs mb-1">
              <CloudSun className="h-4 w-4" />
              <span>Pronóstico</span>
            </div>
            <p className="text-2xl font-bold">
              {todayForecast ? `${Math.round(todayForecast.tempMax || 0)}°` : '--'}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Forecast */}
      {todayForecast && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold text-gray-900">Pronóstico de Hoy</h2>
              {stations.length > 0 && (
                <span className="text-sm text-gray-500">— {stations[0].nombre_estacion}</span>
              )}
            </div>
            <Link to="/forecasts" className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
              Ver 7 días <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Weather icon + description */}
              <div className="flex items-center gap-4">
                {getWeatherIcon(todayForecast.weatherIcon, 'h-20 w-20')}
                <div>
                  <p className="text-gray-600 capitalize text-lg">{todayForecast.weatherDescription}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-3xl font-bold text-red-500">{Math.round(todayForecast.tempMax)}°</span>
                    <span className="text-gray-300">/</span>
                    <span className="text-3xl font-bold text-blue-500">{Math.round(todayForecast.tempMin)}°</span>
                  </div>
                </div>
              </div>

              {/* Weather details */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <Umbrella className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Prob. Lluvia</p>
                  <p className="text-lg font-bold text-blue-700">{todayForecast.precipitationProbability}%</p>
                </div>
                <div className="bg-teal-50 rounded-xl p-3 text-center">
                  <Wind className="h-5 w-5 text-teal-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Viento</p>
                  <p className="text-lg font-bold text-teal-700">{Math.round(todayForecast.windSpeed)} km/h</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                  <Droplets className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Humedad</p>
                  <p className="text-lg font-bold text-indigo-700">{todayForecast.humidityMin}-{todayForecast.humidityMax}%</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3 text-center">
                  <Sun className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Índice UV</p>
                  <p className={`text-lg font-bold ${
                    todayForecast.uvIndex >= 8 ? 'text-red-600' :
                    todayForecast.uvIndex >= 6 ? 'text-orange-500' :
                    todayForecast.uvIndex >= 3 ? 'text-yellow-600' : 'text-green-600'
                  }`}>{todayForecast.uvIndex?.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stations Map */}
      {validStations.length > 0 && (() => {
        const lats = validStations.map(s => parseFloat(s.lat));
        const lons = validStations.map(s => parseFloat(s.lon));
        const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
        const centerLon = lons.reduce((a, b) => a + b, 0) / lons.length;

        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Mapa de Estaciones</h2>
                  <span className="ml-2 text-sm text-gray-500">{validStations.length} estación{validStations.length !== 1 ? 'es' : ''}</span>
                </div>
                <Link to="/stations" className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Gestionar <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
                  <span>En línea (&le;10 min)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  <span>Retraso (10 min - 2 hrs)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                  <span>Sin conexión (&gt;2 hrs)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block"></span>
                  <span>Sin datos</span>
                </div>
              </div>
            </div>
            <div style={{ height: '400px', width: '100%' }}>
              <MapContainer
                center={[centerLat, centerLon]}
                zoom={validStations.length === 1 ? 12 : 6}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {validStations.map((station) => {
                  const stats = stationStats[station.id_estacion];
                  const color = getMarkerColor(stats?.reportDate);
                  const status = getStatusInfo(color);
                  return (
                    <Marker
                      key={station.id}
                      position={[parseFloat(station.lat), parseFloat(station.lon)]}
                      icon={getMarkerIcon(color)}
                    >
                      <Popup minWidth={340} maxWidth={400}>
                        <div style={{ minWidth: '320px', fontFamily: 'system-ui, sans-serif' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {station.nombre_estacion}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                {station.localidad && `${station.localidad}, `}{station.ciudad}{station.pais && ` · ${station.pais}`}
                              </div>
                            </div>
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                              backgroundColor: color === 'green' ? '#dcfce7' : color === 'orange' ? '#fef3c7' : color === 'red' ? '#fee2e2' : '#f3f4f6',
                              color: color === 'green' ? '#15803d' : color === 'orange' ? '#b45309' : color === 'red' ? '#dc2626' : '#6b7280',
                              flexShrink: 0, marginLeft: '8px'
                            }}>
                              <span style={{
                                width: '7px', height: '7px', borderRadius: '50%', display: 'inline-block',
                                backgroundColor: markerColors[color]
                              }}></span>
                              {status.label}
                            </div>
                          </div>

                          {stats?.reportDate && (
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                              {getTimeAgo(stats.reportDate)}
                            </div>
                          )}

                          {stats ? (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {formatValue(stats.tempCurrent) && (
                                <div style={{ flex: '1 1 0', minWidth: '56px', background: '#f0fdf4', borderRadius: '8px', padding: '6px 4px', textAlign: 'center' }}>
                                  <div style={{ fontSize: '13px', color: '#4ade80' }}>🌡</div>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{formatValue(stats.tempCurrent)}°</div>
                                  <div style={{ fontSize: '9px', color: '#6b7280' }}>Temp</div>
                                </div>
                              )}
                              {formatValue(stats.humidityCurrent) && (
                                <div style={{ flex: '1 1 0', minWidth: '56px', background: '#eff6ff', borderRadius: '8px', padding: '6px 4px', textAlign: 'center' }}>
                                  <div style={{ fontSize: '13px', color: '#60a5fa' }}>💧</div>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{formatValue(stats.humidityCurrent)}%</div>
                                  <div style={{ fontSize: '9px', color: '#6b7280' }}>Hum</div>
                                </div>
                              )}
                              {formatValue(stats.precipCurrent) !== null && (
                                <div style={{ flex: '1 1 0', minWidth: '56px', background: '#eef2ff', borderRadius: '8px', padding: '6px 4px', textAlign: 'center' }}>
                                  <div style={{ fontSize: '13px', color: '#818cf8' }}>🌧</div>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{formatValue(stats.precipCurrent)}</div>
                                  <div style={{ fontSize: '9px', color: '#6b7280' }}>mm</div>
                                </div>
                              )}
                              {formatValue(stats.windSpeedCurrent) && (
                                <div style={{ flex: '1 1 0', minWidth: '56px', background: '#f0fdfa', borderRadius: '8px', padding: '6px 4px', textAlign: 'center' }}>
                                  <div style={{ fontSize: '13px', color: '#2dd4bf' }}>💨</div>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{formatValue(stats.windSpeedCurrent)}</div>
                                  <div style={{ fontSize: '9px', color: '#6b7280' }}>km/h</div>
                                </div>
                              )}
                              {formatValue(stats.solarRadCurrent) && (
                                <div style={{ flex: '1 1 0', minWidth: '56px', background: '#fefce8', borderRadius: '8px', padding: '6px 4px', textAlign: 'center' }}>
                                  <div style={{ fontSize: '13px', color: '#facc15' }}>☀️</div>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{formatValue(stats.solarRadCurrent, 0)}</div>
                                  <div style={{ fontSize: '9px', color: '#6b7280' }}>W/m²</div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', padding: '8px 0' }}>
                              Sin datos disponibles
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        );
      })()}

      {/* No stations message */}
      {stations.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <Radio className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No tienes estaciones</h3>
          <p className="text-gray-500 mb-4">Comienza agregando tu primera estación meteorológica</p>
          <Link to="/stations" className="btn-primary inline-flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Ir a Estaciones
          </Link>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/stations" className="group">
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 p-5 text-center group-hover:-translate-y-1 duration-200">
            <div className="inline-flex p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl mb-3 group-hover:scale-110 transition-transform">
              <Radio className="h-6 w-6 text-white" />
            </div>
            <p className="font-semibold text-gray-800">Estaciones</p>
          </div>
        </Link>
        <Link to="/forecasts" className="group">
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 p-5 text-center group-hover:-translate-y-1 duration-200">
            <div className="inline-flex p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mb-3 group-hover:scale-110 transition-transform">
              <CloudSun className="h-6 w-6 text-white" />
            </div>
            <p className="font-semibold text-gray-800">Pronóstico</p>
          </div>
        </Link>
        <Link to="/data-query" className="group">
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 p-5 text-center group-hover:-translate-y-1 duration-200">
            <div className="inline-flex p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl mb-3 group-hover:scale-110 transition-transform">
              <Thermometer className="h-6 w-6 text-white" />
            </div>
            <p className="font-semibold text-gray-800">Consulta</p>
          </div>
        </Link>
        <Link to="/alerts" className="group">
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 p-5 text-center group-hover:-translate-y-1 duration-200">
            <div className="inline-flex p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl mb-3 group-hover:scale-110 transition-transform">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <p className="font-semibold text-gray-800">Alertas</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Home;
