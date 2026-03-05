import { Radio, MapPin, Edit2, Trash2, Eye, Activity, Gauge, Crosshair, MapPinned } from 'lucide-react';

const getMarkerColor = (reportDate) => {
  if (!reportDate) return 'gray';
  const parsed = new Date(reportDate + 'Z');
  if (isNaN(parsed.getTime())) return 'gray';
  const diffMs = new Date() - parsed;
  const diffMinutes = diffMs / (1000 * 60);
  if (diffMinutes <= 10) return 'green';
  if (diffMinutes <= 120) return 'orange';
  return 'red';
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

const getStatusInfo = (color) => {
  switch (color) {
    case 'green': return { label: 'En línea', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' };
    case 'orange': return { label: 'Retraso', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' };
    default: return { label: 'Sin datos', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' };
  }
};

const StationCard = ({ station, stats, onEdit, onDelete, onViewDetails }) => {
  const color = getMarkerColor(stats?.reportDate);
  const status = getStatusInfo(color);
  const timeAgo = getTimeAgo(stats?.reportDate);

  return (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all border-2 overflow-hidden ${
      color === 'green' ? 'border-green-300' : color === 'orange' ? 'border-amber-300' : color === 'red' ? 'border-red-300' : 'border-gray-200'
    }`}>
      <div className={`px-4 py-2 flex items-center justify-between ${
        color === 'green' ? 'bg-green-50' : color === 'orange' ? 'bg-amber-50' : color === 'red' ? 'bg-red-50' : 'bg-gray-50'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${status.dot} ${color === 'green' ? 'animate-pulse' : ''}`}></span>
          <span className={`text-xs font-semibold ${status.text}`}>{status.label}</span>
        </div>
        {timeAgo ? (
          <span className="text-xs text-gray-500">{timeAgo}</span>
        ) : (
          <span className="text-xs text-gray-400">Sin reportes</span>
        )}
      </div>

      <div className="px-4 pt-4 pb-2 flex justify-between items-start">
        <h3 className="font-bold text-xl text-gray-900 uppercase leading-tight">{station.nombre_estacion}</h3>
        <div className="flex space-x-1 flex-shrink-0 ml-2">
          <button onClick={() => onEdit(station)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(station.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 grid grid-cols-2 gap-3 mt-1">
        <div className="flex items-start gap-2">
          <Radio className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-400">ID Estación</p>
            <p className="font-semibold text-gray-700 text-sm">{station.id_estacion || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-400">Ubicación</p>
            <p className="font-semibold text-gray-700 text-sm">{[station.ciudad, station.departamento].filter(Boolean).join(', ') || '—'}</p>
          </div>
        </div>
        {station.marca && (
          <div className="flex items-start gap-2">
            <Activity className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-400">Marca</p>
              <p className="font-semibold text-gray-700 text-sm">{station.marca}</p>
            </div>
          </div>
        )}
        {station.modelo && (
          <div className="flex items-start gap-2">
            <Gauge className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-400">Modelo</p>
              <p className="font-semibold text-gray-700 text-sm">{station.modelo}</p>
            </div>
          </div>
        )}
        {station.freq && (
          <div className="flex items-start gap-2">
            <Crosshair className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-400">Frecuencia</p>
              <p className="font-semibold text-gray-700 text-sm">{station.freq} MHz</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-2">
          <MapPinned className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-400">Coordenadas</p>
            <p className="font-semibold text-gray-700 text-sm">{station.lat}, {station.lon}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={() => onViewDetails(station)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
        >
          <Eye className="h-4 w-4" />
          <span>Detalles</span>
        </button>
      </div>
    </div>
  );
};

export default StationCard;
