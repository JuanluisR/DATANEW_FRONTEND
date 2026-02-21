import { useState, useEffect } from 'react';
import stationService from '../services/stationService';
import dataStationService from '../services/dataStationService';
import subscriptionService from '../services/subscriptionService';
import sensorService from '../services/sensorService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { useZodForm, InputField, SelectField, FormButtons, z } from '../components/FormFields';
import { useDebounce } from '../components/FormFields';
import { Plus, Edit2, Trash2, X, Radio, MapPin, Eye, Thermometer, Droplets, Wind, Gauge, Calendar, MapPinned, Crosshair, TrendingUp, Sun, CloudRain, Search, Activity, Key } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const stationSchema = z.object({
  nombre_estacion: z.string().min(1, 'El nombre de la estación es requerido'),
  id_estacion: z.string().min(1, 'El ID de la estación es requerido'),
  lat: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= -90 && num <= 90;
  }, 'La latitud debe estar entre -90 y 90'),
  lon: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= -180 && num <= 180;
  }, 'La longitud debe estar entre -180 y 180'),
  departamento: z.string().min(1, 'El departamento es requerido'),
  ciudad: z.string().min(1, 'La ciudad es requerida'),
  pais: z.string().min(1, 'El país es requerido'),
  elevacion: z.string().optional(),
  altura_suelo: z.string().optional(),
  freq: z.string().optional(),
  marca: z.string().min(1, 'La marca es requerida'),
  modelo: z.string().min(1, 'El modelo es requerido'),
  passkey: z.string().optional(),
  imei: z.string().optional(),
  api_key: z.string().optional(),
  api_secret: z.string().optional(),
  weatherlink_id: z.string().optional(),
  username: z.string().optional(),
});

// Fix default marker icons for leaflet + bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

const getWindArrow = (dir) => {
  if (!dir) return '';
  const cleanDir = String(dir).toUpperCase().trim();
  return WIND_DIR_MAP[cleanDir] !== undefined ? '▲' : '';
};

const Stations = () => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [stations, setStations] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [stationData, setStationData] = useState([]);
  const [climateStats, setClimateStats] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [chartTimeRange, setChartTimeRange] = useState('7');
  const [editingStation, setEditingStation] = useState(null);
  const [weatherlinkDevices, setWeatherlinkDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [stationStats, setStationStats] = useState({});
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCenter, setMapCenter] = useState([4.5, -74.0]);
  const [mapZoom, setMapZoom] = useState(6);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [stationSensors, setStationSensors] = useState([]);
  const [loadingSensors, setLoadingSensors] = useState(false);
  const [allSensors, setAllSensors] = useState([]);
  const [loadingAllSensors, setLoadingAllSensors] = useState(false);
  const [showSensorDetailModal, setShowSensorDetailModal] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState(null);

  const defaultValues = {
    nombre_estacion: '', lat: '', lon: '', departamento: '', ciudad: '', pais: '',
    elevacion: '', altura_suelo: '',
    key: '', username: user?.username || '', freq: '915', marca: '', modelo: '', id_estacion: '',
    passkey: '', imei: '', api_key: '', api_secret: '', weatherlink_id: ''
  };

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useZodForm(defaultValues, stationSchema);
  const watchMarca = watch('marca');
  const watchModelo = watch('modelo');
  const watchLat = watch('lat');
  const watchLon = watch('lon');
  const debouncedLat = useDebounce(watchLat, 1000);
  const debouncedLon = useDebounce(watchLon, 1000);

  const marcas = [
    { value: 'Meteoagro', label: 'Meteoagro' },
    { value: 'Ecowitt', label: 'Ecowitt' },
    { value: 'Davis', label: 'Davis' },
    { value: 'Otras', label: 'Otras' }
  ];

  const modelosPorMarca = {
    Meteoagro: [
      { value: 'MA9000', label: 'MA9000' },
      { value: 'MA2300', label: 'MA2300' },
      { value: 'MA1000', label: 'MA1000' },
      { value: 'MA1000 sensor', label: 'MA1000 sensor' },
      { value: 'MA2000', label: 'MA2000' },
      { value: 'MA3000', label: 'MA3000' },
      { value: 'MA6200', label: 'MA6200' },
      { value: 'MA6000', label: 'MA6000' }
    ],
    Ecowitt: [
      { value: 'GW1000', label: 'GW1000' },
      { value: 'GW1100', label: 'GW1100' },
      { value: 'GW2000', label: 'GW2000' },
      { value: 'HP2550', label: 'HP2550' }
    ],
    Davis: [
      { value: 'Vantage Pro2 Plus', label: 'Vantage Pro2 Plus' },
      { value: 'Vantage Pro2', label: 'Vantage Pro2' },
      { value: 'Vantage Vue', label: 'Vantage Vue' }
    ],
    Otras: [
      { value: 'Otra', label: 'Otra' }
    ]
  };

  const showPasskey = watchMarca === 'Meteoagro' && 
    ['MA9000', 'MA2300', 'MA1000', 'MA1000 sensor', 'MA2000', 'MA3000', 'MA6200'].includes(watchModelo);
  
  const showImei = watchMarca === 'Meteoagro' && watchModelo === 'MA6000';
  
  const showWeatherlink = watchMarca === 'Davis' && 
    ['Vantage Pro2 Plus', 'Vantage Pro2'].includes(watchModelo);

  const handleConsultWeatherlink = async () => {
    const apiKey = watch('api_key');
    const apiSecret = watch('api_secret');
    if (!apiKey || !apiSecret) {
      toast.warning('Ingresa API Key y Secret Key de Weatherlink');
      return;
    }
    try {
      setLoadingDevices(true);
      const response = await stationService.getWeatherlinkDevices(apiKey, apiSecret);
      setWeatherlinkDevices(response.data);
      if (response.data.length === 0) {
        toast.warning('No se encontraron dispositivos');
      }
    } catch (error) {
      console.error('Error consultando dispositivos:', error);
      toast.error('Error al consultar dispositivos de Weatherlink');
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    const fetchLocationFromCoords = async () => {
      if (editingStation) return;
      
      const lat = parseFloat(debouncedLat);
      const lon = parseFloat(debouncedLon);
      
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && (lat !== 0 || lon !== 0)) {
        try {
          const response = await stationService.geocode(lat, lon);
          const data = response.data;
          
          if (data.departamento && !watch('departamento')) {
            setValue('departamento', data.departamento);
          }
          if (data.ciudad && !watch('ciudad')) {
            setValue('ciudad', data.ciudad);
          }
          if (data.pais && !watch('pais')) {
            setValue('pais', data.pais);
          }
          if (data.elevacion && !watch('elevacion')) {
            setValue('elevacion', data.elevacion.toString());
          }
        } catch (err) {
          console.error('Error en geocodificación inversa:', err);
        }
      }
    };

    fetchLocationFromCoords();
  }, [debouncedLat, debouncedLon, editingStation, setValue, watch]);

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&accept-language=es`,
        { headers: { 'User-Agent': 'DataNewWeather/1.0' } }
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error buscando ubicación:', error);
      toast.error('Error al buscar ubicación');
    } finally {
      setSearching(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        setMapZoom(15);
        setMarkerPosition([latitude, longitude]);
        setValue('lat', latitude.toFixed(5));
        setValue('lon', longitude.toFixed(5));
        setGettingLocation(false);
        toast.success('Ubicación obtenida');
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        toast.error('No se pudo obtener la ubicación');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setMarkerPosition([lat, lng]);
    setValue('lat', lat.toFixed(5));
    setValue('lon', lng.toFixed(5));
  };

  const openMapPicker = () => {
    const lat = parseFloat(watchLat);
    const lon = parseFloat(watchLon);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      setMapCenter([lat, lon]);
      setMapZoom(15);
      setMarkerPosition([lat, lon]);
    }
    setShowMapPicker(true);
  };

  useEffect(() => {
    if (user?.username) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stationsRes, subscriptionRes, sensorsRes] = await Promise.all([
        stationService.getByUsername(user.username),
        subscriptionService.getByUsername(user.username),
        sensorService.getAll()
      ]);
      setStations(stationsRes.data);
      setSubscription(subscriptionRes.data);
      setAllSensors(sensorsRes.data || []);

      // Fetch climate stats for all stations (for map markers)
      // Skip stations known to have no climate data (return 404)
      const stationList = stationsRes.data;
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
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const stationData = {
        ...data,
        weatherlink_id: data.weatherlink_id || null
      };
      if (editingStation) {
        await stationService.update(editingStation.id, stationData);
      } else {
        await stationService.create(stationData);
      }
      fetchData();
      closeModal();
    } catch (error) {
      console.error('Error al guardar estación:', error);
      toast.error('Error al guardar estación: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm('¿Estás seguro de eliminar esta estación? Esta acción no se puede deshacer.');
    if (confirmed) {
      try {
        await stationService.delete(id);
        fetchData();
        toast.success('Estación eliminada correctamente');
      } catch (error) {
        toast.error('Error al eliminar la estación');
      }
    }
  };

  const openModal = (station = null) => {
    setEditingStation(station);
    setWeatherlinkDevices([]);
    if (station) {
      reset({
        nombre_estacion: station.nombre_estacion || '',
        lat: station.lat || '',
        lon: station.lon || '',
        departamento: station.departamento || '',
        ciudad: station.ciudad || '',
        pais: station.pais || '',
        elevacion: station.elevacion || '',
        altura_suelo: station.altura_suelo || station.altura || '',
        key: station.key || '',
        username: station.username || user?.username || '',
        freq: station.freq || '915',
        marca: station.marca || '',
        modelo: station.modelo || '',
        id_estacion: station.id_estacion || '',
        passkey: station.passkey || '',
        imei: station.imei || '',
        api_key: station.api_key || '',
        api_secret: station.api_secret || '',
        weatherlink_id: station.weatherlink_id || ''
      });
    } else {
      reset({
        nombre_estacion: '', lat: '', lon: '', departamento: '', ciudad: '', pais: '',
        elevacion: '', altura_suelo: '',
        key: '', username: user?.username || '', freq: '915', marca: '', modelo: '', id_estacion: '',
        passkey: '', imei: '', api_key: '', api_secret: '', weatherlink_id: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStation(null);
  };

  const formatValue = (value, decimals = 1) => {
    if (value === null || value === undefined || value === 'NaN' || value === '' || isNaN(value)) {
      return null;
    }
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
    if (diffMinutes < 1) return 'Reportó hace menos de 1 minuto';
    if (diffMinutes < 60) return `Reportó hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Reportó hace ${diffHours} hora${diffHours !== 1 ? 's' : ''} y ${diffMinutes % 60} min`;
    if (diffDays === 1) return 'Reportó hace 1 día';
    return `Reportó hace ${diffDays} días`;
  };

  const viewStationDetails = async (station) => {
    setSelectedStation(station);
    setShowDetailModal(true);
    setLoadingData(true);
    setClimateStats(null);
    setHistoryData([]);
    setLoadingHistory(true);
    setStationSensors([]);
    
    try {
      const statsResponse = await dataStationService.getClimateStats(station.id_estacion);
      setClimateStats(statsResponse.data);
      setStationData([{ wswdat_report_date: statsResponse.data.reportDate }]);
    } catch (error) {
      console.error('Error al cargar datos climáticos:', error);
      setClimateStats(null);
      setStationData([]);
    } finally {
      setLoadingData(false);
    }

    // Cargar sensores de la estación
    try {
      setLoadingSensors(true);
      const sensorsResponse = await sensorService.getByStation(station.id_estacion);
      setStationSensors(sensorsResponse.data || []);
    } catch (error) {
      console.error('Error al cargar sensores:', error);
      setStationSensors([]);
    } finally {
      setLoadingSensors(false);
    }

    // Cargar datos del día para las gráficas
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
      
      const historyResponse = await dataStationService.queryByDateRange(
        station.id_estacion,
        startDate,
        endDate
      );
      
      if (historyResponse.data && historyResponse.data.length > 0) {
        // Procesar datos del día para las gráficas
        const processedData = historyResponse.data.map(item => ({
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

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedStation(null);
    setStationData([]);
    setClimateStats(null);
    setHistoryData([]);
    setStationSensors([]);
  };

  const viewSensorDetails = (sensor) => {
    setSelectedSensor(sensor);
    setShowSensorDetailModal(true);
  };

  const closeSensorDetailModal = () => {
    setShowSensorDetailModal(false);
    setSelectedSensor(null);
  };


  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(5);
        const lon = position.coords.longitude.toFixed(5);

        setValue('lat', lat);
        setValue('lon', lon);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`,
            { headers: { 'User-Agent': 'DataNewWeather/1.0' } }
          );
          const data = await res.json();
          if (data?.address) {
            const addr = data.address;
            const departamento = addr.state || addr.county || addr.region || '';
            const ciudad = addr.city || addr.town || addr.municipality || addr.county || '';
            const pais = addr.country || '';

            if (!watch('departamento')) setValue('departamento', departamento);
            if (!watch('ciudad')) setValue('ciudad', ciudad);
            if (!watch('pais')) setValue('pais', pais);
          }
        } catch (err) {
          console.error('Error en geocodificación inversa:', err);
        }

        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Permiso de ubicación denegado. Actívalo en la configuración del navegador.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Ubicación no disponible.');
            break;
          case error.TIMEOUT:
            toast.warning('Tiempo de espera agotado al obtener la ubicación.');
            break;
          default:
            toast.error('Error al obtener la ubicación.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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

  const markerColors = {
    green: '#22c55e',
    orange: '#f59e0b',
    red: '#ef4444',
    gray: '#9ca3af',
  };

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

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  const hasReachedLimit = subscription && subscription.maxStations !== -1 && stations.length >= subscription.maxStations;

  return (
    <div className="space-y-6">

      {/* Mapa de Estaciones */}
      {(() => {
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
                      icon={getMarkerIcon(color)}
                    >
                      <Popup minWidth={340} maxWidth={400}>
                        <div style={{ minWidth: '320px', fontFamily: 'system-ui, sans-serif' }}>
                          {/* Header */}
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

                          {/* Time ago */}
                          {stats?.reportDate && (
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                              {getTimeAgo(stats.reportDate)}
                            </div>
                          )}

                          {/* Variables row */}
                          {stats ? (
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
                              {formatValue(stats.tempCurrent) && (
                                <div style={{
                                  flex: '1 1 0', minWidth: '56px', background: '#f0fdf4', borderRadius: '8px',
                                  padding: '6px 4px', textAlign: 'center'
                                }}>
                                  <div style={{ fontSize: '13px', color: '#4ade80' }}>🌡</div>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{formatValue(stats.tempCurrent)}°</div>
                                  <div style={{ fontSize: '9px', color: '#6b7280' }}>Temp</div>
                                </div>
                              )}
                              {formatValue(stats.humidityCurrent) && (
                                <div style={{
                                  flex: '1 1 0', minWidth: '56px', background: '#eff6ff', borderRadius: '8px',
                                  padding: '6px 4px', textAlign: 'center'
                                }}>
                                  <div style={{ fontSize: '13px', color: '#60a5fa' }}>💧</div>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{formatValue(stats.humidityCurrent)}%</div>
                                  <div style={{ fontSize: '9px', color: '#6b7280' }}>Hum</div>
                                </div>
                              )}
                              {formatValue(stats.precipCurrent) !== null && (
                                <div style={{
                                  flex: '1 1 0', minWidth: '56px', background: '#eef2ff', borderRadius: '8px',
                                  padding: '6px 4px', textAlign: 'center'
                                }}>
                                  <div style={{ fontSize: '13px', color: '#818cf8' }}>🌧</div>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{formatValue(stats.precipCurrent)}</div>
                                  <div style={{ fontSize: '9px', color: '#6b7280' }}>mm</div>
                                </div>
                              )}
                              {formatValue(stats.windSpeedCurrent) && (
                                <div style={{
                                  flex: '1 1 0', minWidth: '56px', background: '#f0fdfa', borderRadius: '8px',
                                  padding: '6px 4px', textAlign: 'center'
                                }}>
                                  <div style={{ fontSize: '13px', color: '#2dd4bf' }}>💨</div>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{formatValue(stats.windSpeedCurrent)}</div>
                                  <div style={{ fontSize: '9px', color: '#6b7280' }}>km/h</div>
                                </div>
                              )}
                              {formatValue(stats.solarRadCurrent) && (
                                <div style={{
                                  flex: '1 1 0', minWidth: '56px', background: '#fefce8', borderRadius: '8px',
                                  padding: '6px 4px', textAlign: 'center'
                                }}>
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

                          {/* Button */}
                          <button
                            onClick={() => viewStationDetails(station)}
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
      })()}

      {/* Header de Estaciones */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Estaciones</h2>
          <p className="text-gray-600 mt-1">Gestiona tus estaciones meteorológicas</p>
        </div>
        {!hasReachedLimit && (
          <button onClick={() => openModal()} className="btn-primary flex items-center space-x-2">
            <Plus className="h-5 w-5" /><span>Nueva Estación</span>
          </button>
        )}
      </div>

      {/* Grid de Estaciones */}
      {stations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <Radio className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No tienes estaciones</h3>
          <p className="text-gray-500 mb-6">Comienza agregando tu primera estación meteorológica</p>
          {!hasReachedLimit && (
            <button onClick={() => openModal()} className="btn-primary inline-flex items-center space-x-2">
              <Plus className="h-5 w-5" /><span>Crear Primera Estación</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((station) => {
            const stats = stationStats[station.id_estacion];
            const color = getMarkerColor(stats?.reportDate);
            const status = getStatusInfo(color);
            const timeAgo = getTimeAgo(stats?.reportDate);

            return (
              <div key={station.id} className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all border-2 overflow-hidden ${
                color === 'green' ? 'border-green-300' : color === 'orange' ? 'border-amber-300' : color === 'red' ? 'border-red-300' : 'border-gray-200'
              }`}>
                {/* Status bar */}
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
                    <button onClick={() => openModal(station)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(station.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition">
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
                    onClick={() => viewStationDetails(station)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Detalles</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sensores del Usuario */}
      {allSensors.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Activity className="h-7 w-7 mr-2 text-purple-600" />
            Mis Sensores
          </h2>
          
          {/* Cards de sensores agrupados por estación */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allSensors.map((sensor) => {
              const station = stations.find(s => s.id_estacion === sensor.id_estacion);
              return (
                <div key={sensor.sensor_id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-purple-200 overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-2 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-semibold text-purple-700">Sensor</span>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {sensor.tipo_sensor}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-xl text-gray-900 uppercase mb-3">{sensor.nombre_sensor}</h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <Activity className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-400">Tipo</p>
                          <p className="font-semibold text-gray-700 text-sm">{sensor.tipo_sensor || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Gauge className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-400">ID Sensor</p>
                          <p className="font-semibold text-gray-700 text-sm">{sensor.id_sensor || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Radio className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-400">Modelo</p>
                          <p className="font-semibold text-gray-700 text-sm">{sensor.model_sensor || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Key className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-400">Key</p>
                          <p className="font-semibold text-gray-700 text-sm font-mono truncate">{sensor.key_sensor || '—'}</p>
                        </div>
                      </div>
                      {station && (
                        <div className="flex items-start gap-2 col-span-2">
                          <MapPin className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-400">Estación</p>
                            <p className="font-semibold text-gray-700 text-sm">{station.nombre_estacion}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => viewSensorDetails(sensor)}
                      className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
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
      )}

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 overflow-x-hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold">{editingStation ? 'Editar' : 'Nueva'} Estación</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <InputField
                    label="Nombre de la Estación"
                    name="nombre_estacion"
                    register={register}
                    error={errors.nombre_estacion}
                    placeholder="Mi estación meteorológica"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <InputField
                    label="ID de la Estación"
                    name="id_estacion"
                    register={register}
                    error={errors.id_estacion}
                    placeholder="Ej: METEOAGRO1"
                    disabled={!!editingStation}
                  />
                </div>
                {editingStation ? (
                  <div className="md:col-span-2">
                    <label className="label">Coordenadas</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input type="text" className="input-field bg-gray-100" {...register('lat')} readOnly />
                        <p className="text-xs text-gray-500 mt-1">Latitud</p>
                      </div>
                      <div>
                        <input type="text" className="input-field bg-gray-100" {...register('lon')} readOnly />
                        <p className="text-xs text-gray-500 mt-1">Longitud</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="md:col-span-2">
                    <label className="label">Coordenadas</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <InputField
                          name="lat"
                          register={register}
                          error={errors.lat}
                          type="number"
                          step="0.00001"
                          placeholder="Latitud"
                          required
                          helpText="-90 a 90"
                          onChange={(e) => {
                            const val = e.target.value;
                            const dot = val.indexOf('.');
                            if (dot !== -1 && val.length - dot - 1 > 5) setValue('lat', val.substring(0, dot + 6));
                          }}
                        />
                      </div>
                      <div>
                        <InputField
                          name="lon"
                          register={register}
                          error={errors.lon}
                          type="number"
                          step="0.00001"
                          placeholder="Longitud"
                          required
                          helpText="-180 a 180"
                          onChange={(e) => {
                            const val = e.target.value;
                            const dot = val.indexOf('.');
                            if (dot !== -1 && val.length - dot - 1 > 5) setValue('lon', val.substring(0, dot + 6));
                          }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openMapPicker}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <MapPin className="h-4 w-4" />
                      Seleccionar en el mapa
                    </button>
                  </div>
                )}
                <InputField
                  label="Departamento"
                  name="departamento"
                  register={register}
                  error={errors.departamento}
                  placeholder="Departamento"
                  required
                />
                <InputField
                  label="Ciudad"
                  name="ciudad"
                  register={register}
                  error={errors.ciudad}
                  placeholder="Ciudad"
                  required
                />
                <InputField
                  label="País"
                  name="pais"
                  register={register}
                  error={errors.pais}
                  placeholder="País"
                  required
                />
                <InputField
                  label="Elevación (m)"
                  name="elevacion"
                  register={register}
                  error={errors.elevacion}
                  placeholder="Elevación"
                  helpText=" metros sobre el nivel del mar"
                />
                <InputField
                  label="Altura del sensor (m)"
                  name="altura_suelo"
                  register={register}
                  error={errors.altura_suelo}
                  type="number"
                  step="any"
                  placeholder="Altura del sensor"
                  helpText=" altura desde el suelo"
                />
                <div className="md:col-span-2">
                  <InputField
                    label="Frecuencia (MHz)"
                    name="freq"
                    register={register}
                    error={errors.freq}
                    placeholder="915"
                    disabled={!!editingStation}
                  />
                </div>
                <div className="md:col-span-2">
                  <SelectField
                    label="Marca"
                    name="marca"
                    register={register}
                    error={errors.marca}
                    options={marcas}
                    required
                    onChange={(e) => {
                      setValue('marca', e.target.value);
                      setValue('modelo', '');
                    }}
                  />
                </div>
                <SelectField
                  label="Modelo"
                  name="modelo"
                  register={register}
                  error={errors.modelo}
                  options={modelosPorMarca[watchMarca] || []}
                  disabled={!watchMarca}
                  required
                />
                {showPasskey && (
                  <InputField
                    label="Passkey"
                    name="passkey"
                    register={register}
                    error={errors.passkey}
                    placeholder="Passkey"
                  />
                )}
                {showImei && (
                  <InputField
                    label="IMEI"
                    name="imei"
                    register={register}
                    error={errors.imei}
                    placeholder="IMEI"
                  />
                )}
                {showWeatherlink && (
                  <>
                    <InputField
                      label="Weatherlink API Key"
                      name="api_key"
                      register={register}
                      error={errors.api_key}
                      placeholder="API Key"
                    />
                    <div className="md:col-span-2">
                      <label className="label">Weatherlink Secret Key</label>
                      <div className="flex gap-2">
                        <InputField
                          name="api_secret"
                          register={register}
                          error={errors.api_secret}
                          placeholder="Secret Key"
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleConsultWeatherlink}
                          disabled={loadingDevices}
                          className="btn-secondary px-4 py-2 whitespace-nowrap"
                        >
                          {loadingDevices ? 'Consultando...' : 'Consultar'}
                        </button>
                      </div>
                    </div>
                    {weatherlinkDevices.length > 0 && (
                      <>
                        <div className="md:col-span-2">
                          <SelectField
                            label="Seleccionar Dispositivo"
                            name="weatherlink_id"
                            register={register}
                            error={errors.weatherlink_id}
                            options={weatherlinkDevices.map(d => ({ value: d.station_id, label: `${d.station_name} (ID: ${d.station_id})` }))}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
              <FormButtons
                submitLabel={editingStation ? 'Actualizar' : 'Crear'}
                submitLoading={isSubmitting}
                onCancel={closeModal}
              />
            </form>
          </div>
        </div>
      )}

      {/* Modal Mapa */}
      {showMapPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-green-600 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Seleccionar ubicación
              </h2>
              <button onClick={() => setShowMapPicker(false)} className="p-1 hover:bg-green-700 rounded">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Buscador */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                    placeholder="Buscar lugar..."
                    className="input-field pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <button
                  onClick={handleSearchLocation}
                  disabled={searching}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {searching ? '...' : 'Buscar'}
                </button>
                <button
                  onClick={handleGetCurrentLocation}
                  disabled={gettingLocation}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Crosshair className="h-4 w-4" />
                  {gettingLocation ? '...' : 'GPS'}
                </button>
              </div>

              {/* Resultados de búsqueda */}
              {searchResults.length > 0 && (
                <div className="bg-gray-50 rounded-lg max-h-40 overflow-y-auto border">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSearchResult(result)}
                      className="w-full text-left px-3 py-2 hover:bg-green-50 border-b last:border-b-0 text-sm"
                    >
                      {result.display_name}
                    </button>
                  ))}
                </div>
              )}

              {/* Mapa */}
              <div className="h-96 rounded-lg overflow-hidden border">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                  whenReady={(mapInstance) => {
                    mapInstance.target.on('click', handleMapClick);
                  }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {markerPosition && (
                    <Marker position={markerPosition} draggable={true} eventHandlers={{ dragend: (e) => {
                      const { lat, lng } = e.target.getLatLng();
                      setValue('lat', lat.toFixed(5));
                      setValue('lon', lng.toFixed(5));
                    }}} />
                  )}
                </MapContainer>
              </div>

              {/* Coordenadas actuales */}
              <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">Lat:</span> {watchLat ? parseFloat(watchLat).toFixed(5) : '—'}
                  <span className="mx-3">|</span>
                  <span className="font-medium">Lon:</span> {watchLon ? parseFloat(watchLon).toFixed(5) : '—'}
                </div>
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles */}
      {showDetailModal && selectedStation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
              <div className="flex items-center space-x-3">
                <Radio className="h-8 w-8" />
                <div>
                  <h2 className="text-2xl font-bold">{selectedStation.nombre_estacion}</h2>
                  <p className="text-green-100 text-sm">{selectedStation.id_estacion ? `ID: ${selectedStation.id_estacion}` : `ID: ${selectedStation.id}`}</p>
                </div>
              </div>
              <button onClick={closeDetailModal} className="p-2 hover:bg-white/20 rounded-lg transition">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info de la estación */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-gray-400 text-xs">Coordenadas</p>
                      <p className="font-medium">{selectedStation.lat}, {selectedStation.lon}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPinned className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-gray-400 text-xs">Ubicación</p>
                      <p className="font-medium">{selectedStation.departamento && `${selectedStation.departamento}, `}{selectedStation.ciudad}</p>
                    </div>
                  </div>
                  {selectedStation.freq && (
                    <div className="flex items-center space-x-2">
                      <Radio className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-gray-400 text-xs">Frecuencia</p>
                        <p className="font-medium">{selectedStation.freq} MHz</p>
                      </div>
                    </div>
                  )}
                  {stationData.length > 0 && stationData[0].wswdat_report_date && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-gray-400 text-xs">Último Reporte</p>
                        <p className="font-medium">{parseDateTime(stationData[0].wswdat_report_date)?.toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Datos Climáticos */}
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
                    {/* Header dato más reciente */}
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
                          <Thermometer className="h-6 w-6 text-green-500 mx-auto mb-2 transition-all duration-300 group-hover:scale-125 group-hover:-translate-y-1 animate-pulse" />
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
                          <Droplets className="h-6 w-6 text-blue-500 mx-auto mb-2 transition-all duration-300 group-hover:scale-125 group-hover:-translate-y-1 animate-bounce" />
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
                          <CloudRain className="h-6 w-6 text-indigo-500 mx-auto mb-2 transition-all duration-300 group-hover:scale-125 group-hover:translate-y-0.5 animate-bounce" />
                          <div className="text-2xl font-bold text-indigo-700">{formatValue(climateStats.precipCurrent)} mm</div>
                          <div className="text-xs text-gray-500 mt-1">Precipitación</div>
                        </div>
                      )}

                      {formatValue(climateStats.windSpeedCurrent) && (
                        <div className="group bg-teal-50 rounded-xl p-4 text-center border border-teal-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                          <Wind className="h-6 w-6 text-teal-500 mx-auto mb-2 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12" style={{ animation: 'windSway 2s ease-in-out infinite' }} />
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
                          <Gauge className="h-6 w-6 text-gray-500 mx-auto mb-2 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 animate-pulse" />
                          <div className="text-2xl font-bold text-gray-700">{formatValue(climateStats.pressureCurrent)} hPa</div>
                          <div className="text-xs text-gray-500 mt-1">Presión</div>
                          <div className="flex justify-between text-xs mt-2 text-gray-400">
                            <span>Max: {formatValue(climateStats.pressureMax)}</span>
                            <span>Min: {formatValue(climateStats.pressureMin)}</span>
                          </div>
                        </div>
                      )}

                      {formatValue(climateStats.solarRadCurrent) && (
                        <div className="group bg-yellow-50 rounded-xl p-4 text-center border border-yellow-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                          <Sun className="h-6 w-6 text-yellow-500 mx-auto mb-2 transition-all duration-300 group-hover:scale-125" style={{ animation: 'spin 8s linear infinite' }} />
                          <div className="text-2xl font-bold text-amber-600">{formatValue(climateStats.solarRadCurrent)} W/m²</div>
                          <div className="text-xs text-gray-500 mt-1">Radiación Solar</div>
                        </div>
                      )}

                      {(climateStats.windDirCurrent || climateStats.windDegreesCurrent != null) && (
                        <div className="group bg-teal-50 rounded-xl p-4 text-center border border-teal-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                          <Wind className="h-6 w-6 text-teal-400 mx-auto mb-2 transition-all duration-300 group-hover:scale-125" style={{ animation: 'windSway 3s ease-in-out infinite' }} />
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
                          <Droplets className="h-6 w-6 text-cyan-500 mx-auto mb-2 transition-all duration-300 group-hover:scale-125 group-hover:-translate-y-1 animate-bounce" />
                          <div className="text-2xl font-bold text-cyan-700">{formatValue(climateStats.dewpointCurrent)}°C</div>
                          <div className="text-xs text-gray-500 mt-1">Punto Rocío</div>
                        </div>
                      )}

                      {historyData.length > 0 && formatValue(historyData[historyData.length - 1]?.uvIndex, 1) && (
                        <div className="group bg-orange-50 rounded-xl p-4 text-center border border-orange-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                          <Sun className="h-6 w-6 text-orange-400 mx-auto mb-2 transition-all duration-300 group-hover:scale-125 group-hover:rotate-45 animate-pulse" />
                          <div className="text-2xl font-bold text-orange-600">{formatValue(historyData[historyData.length - 1]?.uvIndex, 1)}</div>
                          <div className="text-xs text-gray-500 mt-1">Índice UV</div>
                        </div>
                      )}

                      {formatValue(climateStats.etoCurrent, 2) && (
                        <div className="group bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                          <Activity className="h-6 w-6 text-emerald-500 mx-auto mb-2 transition-all duration-300 group-hover:scale-125 animate-pulse" />
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

              {/* Gráficas del Día */}
              <div className="mt-6">
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
                    {/* Temperatura y Humedad */}
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
                          tooltip: {
                            shared: true,
                            useHTML: true,
                            formatter: function() {
                              let s = '<b>' + this.x + '</b><br/>';
                              this.points.forEach(point => {
                                if (point.series.name === 'Temperatura') {
                                  s += '<span style="color:' + point.color + '">●</span> Temperatura: <b>' + point.y + ' °C</b><br/>';
                                } else if (point.series.name === 'Humedad') {
                                  s += '<span style="color:' + point.color + '">●</span> Humedad: <b>' + point.y + '%</b>';
                                }
                              });
                              return s;
                            }
                          },
                          plotOptions: {
                            area: {
                              fillOpacity: 0.15,
                              marker: { enabled: historyData.length < 50 },
                              lineWidth: 2
                            },
                            spline: {
                              marker: { enabled: historyData.length < 50 },
                              lineWidth: 2
                            }
                          },
                          series: [
                            { name: 'Temperatura', data: historyData.map(d => d.temp), type: 'spline', color: '#ef4444', yAxis: 0 },
                            { name: 'Humedad', data: historyData.map(d => d.humidity), type: 'area', color: '#3b82f6', yAxis: 1 }
                          ]
                        }}
                      />
                    </div>

                    {/* Presión */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <Gauge className="h-5 w-5 mr-2 text-purple-500" />
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
                          plotOptions: {
                            area: {
                              fillColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, 'rgba(139,92,246,0.3)'], [1, 'rgba(139,92,246,0)']] },
                              marker: { enabled: historyData.length < 50 },
                              color: '#8b5cf6',
                              lineWidth: 2
                            }
                          },
                          series: [{ name: 'Presión', data: historyData.map(d => d.pressure) }]
                        }}
                      />
                    </div>

                    {/* Viento */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Wind className="h-5 w-5 text-green-500" />
                        Viento (Velocidad y Dirección)
                      </h4>
                      <HighchartsReact
                        highcharts={Highcharts}
                        options={{
                          chart: { height: 300 },
                          title: { text: '' },
                          xAxis: { categories: historyData.map(d => d.date) },
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
                              const pointIdx = this.points?.[0]?.point?.index;
                              const hd = (pointIdx !== undefined && historyData[pointIdx]) ? historyData[pointIdx] : null;
                              const dateLabel = hd?.date || this.x;

                              let speed = 0;
                              let rawDir = null;
                              this.points.forEach(p => {
                                if (p.series.name === 'Velocidad') speed = p.y || 0;
                                else if (p.series.name === 'Dirección') rawDir = p.point?.windDir;
                              });
                              if (rawDir === null && pointIdx !== undefined) {
                                const chartSeries = this.points?.[0]?.series?.chart?.series;
                                const dirSeries = chartSeries?.find(s => s.name === 'Dirección');
                                if (dirSeries?.data?.[pointIdx]) rawDir = dirSeries.data[pointIdx].windDir;
                              }

                              let cardinal = '-';
                              let degreesNum = null;
                              if (rawDir !== null && rawDir !== undefined && rawDir !== '') {
                                const num = Number(rawDir);
                                if (!isNaN(num)) {
                                  degreesNum = num;
                                  const idx = Math.round(((num % 360) / 22.5)) % 16;
                                  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
                                  cardinal = dirs[idx] || '-';
                                } else {
                                  cardinal = String(rawDir).toUpperCase().trim();
                                  degreesNum = WIND_DIR_MAP[cardinal] ?? null;
                                }
                              }
                              const dirStr = cardinal !== '-'
                                ? cardinal + (degreesNum !== null ? ' · ' + Math.round(degreesNum) + '°' : '')
                                : (degreesNum !== null ? Math.round(degreesNum) + '°' : '-');

                              let s = '<div style="font-size:12px;padding:6px 8px;min-width:200px">';
                              s += '<div style="font-weight:700;font-size:13px;color:#1f2937;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #e5e7eb">📅 ' + dateLabel + '</div>';
                              s += '<div style="padding:2px 0"><span style="color:#22c55e">●</span> <b>Velocidad:</b> ' + speed.toFixed(1) + ' km/h</div>';
                              s += '<div style="padding:2px 0"><span style="color:#14b8a6">●</span> <b>Dirección:</b> ' + dirStr + '</div>';
                              s += '</div>';
                              return s;
                            }
                          },
                          plotOptions: {
                            spline: {
                              marker: {
                                enabled: true,
                                radius: 5,
                                fillColor: '#22c55e',
                                lineColor: '#16a34a',
                                lineWidth: 1,
                                states: { hover: { radius: 7 } }
                              },
                              lineWidth: 2,
                              enableMouseTracking: true,
                              zIndex: 3
                            },
                            scatter: {
                              enableMouseTracking: false,
                              marker: {
                                symbol: 'arrow',
                                radius: 8,
                                lineWidth: 2,
                                lineColor: '#0d9488'
                              }
                            }
                          },
                          series: [
                            {
                              name: 'Velocidad',
                              data: historyData.map(d => ({ y: d.windSpeed, windDir: d.windDir })),
                              color: '#22c55e',
                              type: 'spline',
                              zIndex: 3
                            },
                            {
                              name: 'Dirección',
                              type: 'scatter',
                              data: historyData.map(d => {
                                if (!d.windDir) return { y: null };
                                const rotation = getWindRotation(d.windDir);
                                const num = Number(d.windDir);
                                const DIRS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
                                const degrees = !isNaN(num) ? num : (WIND_DIR_MAP[String(d.windDir).toUpperCase().trim()] ?? null);
                                const cardinal = !isNaN(num)
                                  ? (DIRS[Math.round(((num % 360) / 22.5)) % 16] || null)
                                  : String(d.windDir).toUpperCase().trim();
                                return {
                                  y: d.windSpeed,
                                  windDir: d.windDir,
                                  degrees: degrees,
                                  cardinal: cardinal,
                                  marker: {
                                    symbol: 'triangle',
                                    fillColor: '#14b8a6',
                                    lineColor: '#0f766e',
                                    lineWidth: 1,
                                    rotation: rotation
                                  }
                                };
                              }),
                              dataLabels: {
                                enabled: true,
                                useHTML: true,
                                formatter: function() {
                                  const dir = this.point.cardinal || String(this.point.windDir || '');
                                  const deg = this.point.degrees !== null && this.point.degrees !== undefined
                                    ? Math.round(this.point.degrees) + '°' : '';
                                  if (!dir && !deg) return '';
                                  return '<div style="text-align:center;font-size:12px;font-weight:bold;color:#0f766e;line-height:1.3;text-shadow:1px 1px 0 white,-1px -1px 0 white,1px -1px 0 white,-1px 1px 0 white">' +
                                    dir + (deg ? '<br/><span style="font-size:11px">' + deg + '</span>' : '') + '</div>';
                                },
                                style: { fontSize: '12px', fontWeight: 'bold', color: '#0f766e' },
                                y: -32
                              },
                              color: '#14b8a6',
                              zIndex: 2
                            }
                          ]
                        }}
                      />
                      {historyData.some(d => d.windDir) && (
                        <div className="mt-3 flex flex-wrap gap-3 text-xs">
                          <span className="text-gray-500 font-medium">Direcciones:</span>
                          {Array.from(new Set(historyData.map(d => d.windDir).filter(Boolean))).slice(0, 8).map(dir => {
                            const arrow = getWindArrow(dir);
                            return (
                              <span key={dir} className="inline-flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-700 rounded font-medium">
                                <span style={{ transform: `rotate(${getWindRotation(dir)}deg)`, display: 'inline-block' }}>▲</span>
                                {dir}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Precipitación */}
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
                          yAxis: [{ 
                            title: { text: 'UV' },
                            min: 0
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
                              let s = '<b>' + this.x + '</b><br/>';
                              this.points.forEach(point => {
                                if (point.series.name === 'Índice UV') {
                                  s += '<span style="color:' + point.color + '">●</span> UV: <b>' + (point.y || 0) + '</b><br/>';
                                } else if (point.series.name === 'Radiación Solar') {
                                  s += '<span style="color:' + point.color + '">●</span> Radiación: <b>' + (point.y || 0) + ' W/m²</b>';
                                }
                              });
                              return s;
                            }
                          },
                          plotOptions: {
                            spline: {
                              marker: { enabled: historyData.length < 50 },
                              lineWidth: 2
                            },
                            area: {
                              fillOpacity: 0.2,
                              marker: { enabled: historyData.length < 50 },
                              lineWidth: 2
                            }
                          },
                          series: [
                            { name: 'Índice UV', data: historyData.map(d => d.uvIndex), type: 'spline', color: '#eab308', yAxis: 0 },
                            { name: 'Radiación Solar', data: historyData.map(d => d.solarRad), type: 'area', color: '#f97316', yAxis: 1 }
                          ]
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No hay reportes del día</p>
                    <p className="text-gray-400 text-sm mt-1">Los reportes del día aparecerán aquí</p>
                  </div>
                )}
              </div>

              {/* Sensores de la Estación */}
              <div className="mt-6">
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
                    <p className="text-gray-400 text-sm mt-1">Los sensores aparecerán aquí</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles del Sensor */}
      {showSensorDetailModal && selectedSensor && (() => {
        const station = stations.find(s => s.id_estacion === selectedSensor.id_estacion);
        const stats = station ? stationStats[selectedSensor.id_estacion] : null;
        
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
                <div className="flex items-center space-x-3">
                  <Activity className="h-8 w-8" />
                  <div>
                    <h2 className="text-2xl font-bold">{selectedSensor.nombre_sensor}</h2>
                    <p className="text-purple-100 text-sm">ID: {selectedSensor.sensor_id}</p>
                  </div>
                </div>
                <button onClick={closeSensorDetailModal} className="p-2 hover:bg-white/20 rounded-lg transition">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Info del sensor */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    Información del Sensor
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Radio className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-gray-400 text-xs">Tipo</p>
                        <p className="font-medium">{selectedSensor.tipo_sensor}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Gauge className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-gray-400 text-xs">ID Sensor</p>
                        <p className="font-medium">{selectedSensor.id_sensor || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-gray-400 text-xs">Modelo</p>
                        <p className="font-medium">{selectedSensor.model_sensor || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Key className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-gray-400 text-xs">Key</p>
                        <p className="font-medium font-mono text-xs">{selectedSensor.key_sensor || '—'}</p>
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

                {/* Datos actuales de la estación (si hay datos) */}
                {stats && (
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Datos Actuales de la Estación
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formatValue(stats.tempCurrent) && (
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <Thermometer className="h-6 w-6 mx-auto text-green-500 mb-1" />
                          <p className="text-2xl font-bold text-green-600">{formatValue(stats.tempCurrent)}°C</p>
                          <p className="text-xs text-gray-500">Temperatura</p>
                        </div>
                      )}
                      {formatValue(stats.humidityCurrent) && (
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <Droplets className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                          <p className="text-2xl font-bold text-blue-600">{formatValue(stats.humidityCurrent)}%</p>
                          <p className="text-xs text-gray-500">Humedad</p>
                        </div>
                      )}
                      {formatValue(stats.precipCurrent) !== null && (
                        <div className="bg-indigo-50 rounded-lg p-3 text-center">
                          <CloudRain className="h-6 w-6 mx-auto text-indigo-500 mb-1" />
                          <p className="text-2xl font-bold text-indigo-600">{formatValue(stats.precipCurrent)} mm</p>
                          <p className="text-xs text-gray-500">Precipitación</p>
                        </div>
                      )}
                      {formatValue(stats.windSpeedCurrent) && (
                        <div className="bg-teal-50 rounded-lg p-3 text-center">
                          <Wind className="h-6 w-6 mx-auto text-teal-500 mb-1" />
                          <p className="text-2xl font-bold text-teal-600">{formatValue(stats.windSpeedCurrent)} km/h</p>
                          <p className="text-xs text-gray-500">Velocidad viento</p>
                        </div>
                      )}
                      {formatValue(stats.pressureCurrent) && (
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <Gauge className="h-6 w-6 mx-auto text-gray-500 mb-1" />
                          <p className="text-2xl font-bold text-gray-600">{formatValue(stats.pressureCurrent)} hPa</p>
                          <p className="text-xs text-gray-500">Presión</p>
                        </div>
                      )}
                      {formatValue(stats.solarRadCurrent) && (
                        <div className="bg-yellow-50 rounded-lg p-3 text-center">
                          <Sun className="h-6 w-6 mx-auto text-yellow-500 mb-1" />
                          <p className="text-2xl font-bold text-yellow-600">{formatValue(stats.solarRadCurrent, 0)} W/m²</p>
                          <p className="text-xs text-gray-500">Radiación Solar</p>
                        </div>
                      )}
                    </div>
                    {stats.reportDate && (
                      <p className="text-xs text-gray-400 mt-4 text-center">
                        Última actualización: {getTimeAgo(stats.reportDate)}
                      </p>
                    )}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={closeSensorDetailModal}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Stations;
