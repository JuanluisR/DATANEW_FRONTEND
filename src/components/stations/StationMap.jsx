import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const markerColors = {
  green: '#22c55e',
  orange: '#f59e0b',
  red: '#ef4444',
  gray: '#9ca3af',
};

const getMarkerColor = (reportDate) => {
  if (!reportDate) return 'gray';
  const dateStr = reportDate.includes('Z') || reportDate.match(/[+-]\d{2}:\d{2}$/) 
    ? reportDate 
    : reportDate + 'Z';
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return 'gray';
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

const getTimeAgo = (dateString) => {
  if (!dateString) return '';
  const dateStr = dateString.includes('Z') || dateString.match(/[+-]\d{2}:\d{2}$/) 
    ? dateString 
    : dateString + 'Z';
  const reportDate = new Date(dateStr);
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

const formatValue = (value, decimals = 1) => {
  if (value === null || value === undefined || value === 'NaN' || value === '' || isNaN(value)) {
    return null;
  }
  return Number(value).toFixed(decimals);
};

const getMarkerIcon = (color, tipoEstacion, precipCurrent) => {
  const fill = markerColors[color] || markerColors.gray;
  const isRaining = parseFloat(precipCurrent) > 0;

  if (isRaining) {
    return L.divIcon({
      className: '',
      iconSize: [44, 52],
      iconAnchor: [22, 52],
      popupAnchor: [0, -54],
      html: `<style>@keyframes rainPulse{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,0.7)}50%{box-shadow:0 0 0 10px rgba(37,99,235,0)}}.rain-pulse{animation:rainPulse 1.2s infinite;border-radius:50%;}</style>
      <div style="position:relative;width:44px;height:52px;text-align:center;">
        <div class="rain-pulse" style="width:44px;height:44px;background:#dbeafe;display:flex;align-items:center;justify-content:center;border-radius:50%;box-shadow:0 2px 6px rgba(37,99,235,0.4);">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/>
            <line x1="8" y1="19" x2="8" y2="21"/><line x1="8" y1="13" x2="8" y2="15"/>
            <line x1="16" y1="19" x2="16" y2="21"/><line x1="16" y1="13" x2="16" y2="15"/>
            <line x1="12" y1="21" x2="12" y2="23"/><line x1="12" y1="15" x2="12" y2="17"/>
          </svg>
        </div>
        <span style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:12px;height:12px;border-radius:50%;background:${fill};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);display:block;"></span>
      </div>`
    });
  }

  const isHidro = tipoEstacion === 'Hidrometeorologica';
  const imgSrc = isHidro ? '/hidro.png' : '/meteo.png';
  const imgFilter = isHidro ? '' : 'filter:saturate(0.45) brightness(1.15) opacity(0.85);';
  return L.divIcon({
    className: '',
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -54],
    html: `<div style="position:relative;width:44px;height:52px;text-align:center;">
      <img src="${imgSrc}" style="width:44px;height:44px;${imgFilter}border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);" onerror="this.style.display='none';this.nextSibling.style.display='block'"/>
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42" style="display:none;margin:0 auto;">
        <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.716 23.284 0 15 0z" fill="${fill}"/>
        <circle cx="15" cy="14" r="6" fill="white" opacity="0.9"/>
      </svg>
      <span style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:12px;height:12px;border-radius:50%;background:${fill};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);display:block;"></span>
    </div>`
  });
};

const StationMap = ({ stations, stationStats, onStationClick }) => {
  const validStations = stations.filter(s => {
    const lat = parseFloat(s.lat);
    const lon = parseFloat(s.lon);
    return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && (lat !== 0 || lon !== 0);
  });

  if (validStations.length === 0) return null;

  const lats = validStations.map(s => parseFloat(s.lat));
  const lons = validStations.map(s => parseFloat(s.lon));
  const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
  const centerLon = lons.reduce((a, b) => a + b, 0) / lons.length;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Ubicación de Estaciones</h2>
          <span className="ml-auto text-sm text-gray-500">{validStations.length} estación{validStations.length !== 1 ? 'es' : ''} en el mapa</span>
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
                icon={getMarkerIcon(color, station.tipo_estacion, stationStats[station.id_estacion]?.precipCurrent)}
              >
                <Popup minWidth={340} maxWidth={400}>
                  <div style={{ minWidth: '320px', fontFamily: 'system-ui, sans-serif' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {station.nombre_estacion}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                          {station.departamento && `${station.departamento}, `}{station.ciudad}{station.pais && ` · ${station.pais}`}
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
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
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
                      <div style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', padding: '8px 0', marginBottom: '10px' }}>
                        Sin datos disponibles
                      </div>
                    )}

                    <button
                      onClick={() => onStationClick(station)}
                      style={{
                        width: '100%', padding: '7px 0', borderRadius: '8px', border: 'none',
                        background: '#2563eb', color: 'white', fontWeight: 600, fontSize: '12px',
                        cursor: 'pointer', transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#1d4ed8'}
                      onMouseOut={(e) => e.target.style.background = '#2563eb'}
                    >
                      Ver Detalles
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default StationMap;
