import { useState, useEffect } from 'react';
import sensorService from '../services/sensorService';
import stationService from '../services/stationService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { useZodForm, InputField, SelectField, FormButtons, z, useDebounce } from '../components/FormFields';
import { Plus, Edit2, Trash2, X, Database, Activity, Gauge, Radio, Key, MapPin, Search, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for leaflet + bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const sensorSchema = z.object({
  nombre_sensor: z.string().min(1, 'El nombre del sensor es requerido'),
  id_estacion: z.string().min(1, 'La estación es requerida'),
  tipo_sensor: z.string().min(1, 'El tipo de sensor es requerido'),
  id_sensor: z.string().optional(),
  model_sensor: z.string().optional(),
  key_sensor: z.string().optional(),
  username: z.string().optional(),
  lat: z.string().optional(),
  lon: z.string().optional(),
  departamento: z.string().optional(),
  ciudad: z.string().optional(),
  pais: z.string().optional(),
  elevacion: z.string().optional(),
});

const Sensors = () => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [sensors, setSensors] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSensor, setEditingSensor] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCenter, setMapCenter] = useState([4.5, -74.0]);
  const [mapZoom, setMapZoom] = useState(6);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const defaultValues = {
    nombre_sensor: '',
    id_estacion: '',
    tipo_sensor: '',
    id_sensor: '',
    model_sensor: '',
    key_sensor: '',
    username: user?.username || '',
    lat: '',
    lon: '',
    departamento: '',
    ciudad: '',
    pais: '',
    elevacion: '',
  };

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useZodForm(defaultValues, sensorSchema);
  const watchLat = watch('lat');
  const watchLon = watch('lon');
  const debouncedLat = useDebounce(watchLat, 1000);
  const debouncedLon = useDebounce(watchLon, 1000);

  useEffect(() => {
    fetchStations();
    fetchSensors();
  }, [user]);

  useEffect(() => {
    const fetchLocationFromCoords = async () => {
      if (editingSensor) return;
      const lat = parseFloat(debouncedLat);
      const lon = parseFloat(debouncedLon);
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && (lat !== 0 || lon !== 0)) {
        try {
          const response = await stationService.geocode(lat, lon);
          const data = response.data;
          if (data.departamento && !watch('departamento')) setValue('departamento', data.departamento);
          if (data.ciudad && !watch('ciudad')) setValue('ciudad', data.ciudad);
          if (data.pais && !watch('pais')) setValue('pais', data.pais);
          if (data.elevacion && !watch('elevacion')) setValue('elevacion', data.elevacion.toString());
        } catch (err) {
          console.error('Error en geocodificación inversa:', err);
        }
      }
    };
    fetchLocationFromCoords();
  }, [debouncedLat, debouncedLon, editingSensor, setValue, watch]);

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

  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setMapCenter([lat, lon]);
    setMapZoom(14);
    setMarkerPosition([lat, lon]);
    setValue('lat', lat.toFixed(5));
    setValue('lon', lon.toFixed(5));
    setSearchResults([]);
    setSearchQuery('');
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

  const fetchStations = async () => {
    try {
      if (!user?.username) return;
      const response = await stationService.getByUsername(user.username);
      setStations(response.data);
    } catch (error) {
      console.error('Error al cargar estaciones:', error);
    }
  };

  const fetchSensors = async () => {
    try {
      if (!user?.username) return;
      const response = await sensorService.getAll();
      const userSensors = response.data.filter(sensor => sensor.username === user.username);
      setSensors(userSensors);
    } catch (error) {
      console.error('Error al cargar sensores:', error);
      toast.error('Error al cargar sensores');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingSensor) {
        await sensorService.update(editingSensor.sensor_id, data);
      } else {
        await sensorService.create(data);
      }
      fetchSensors();
      closeModal();
    } catch (error) {
      toast.error('Error al guardar sensor');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm('¿Estás seguro de eliminar este sensor?');
    if (confirmed) {
      try {
        await sensorService.delete(id);
        fetchSensors();
        toast.success('Sensor eliminado correctamente');
      } catch (error) {
        toast.error('Error al eliminar sensor');
      }
    }
  };

  const openModal = (sensor = null) => {
    setEditingSensor(sensor);
    if (sensor) {
      reset({
        nombre_sensor: sensor.nombre_sensor || '',
        id_estacion: sensor.id_estacion || '',
        tipo_sensor: sensor.tipo_sensor || '',
        id_sensor: sensor.id_sensor || '',
        model_sensor: sensor.model_sensor || '',
        key_sensor: sensor.key_sensor || '',
        username: sensor.username || user?.username || '',
        lat: sensor.lat?.toString() || '',
        lon: sensor.lon?.toString() || '',
        departamento: sensor.departamento || '',
        ciudad: sensor.ciudad || '',
        pais: sensor.pais || '',
        elevacion: sensor.elevacion?.toString() || '',
      });
    } else {
      reset({
        nombre_sensor: '',
        id_estacion: '',
        tipo_sensor: '',
        id_sensor: '',
        model_sensor: '',
        key_sensor: '',
        username: user?.username || '',
        lat: '',
        lon: '',
        departamento: '',
        ciudad: '',
        pais: '',
        elevacion: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSensor(null);
  };

  const stationOptions = stations.map(station => ({
    value: station.id,
    label: `${station.nombre_estacion} - ${station.ciudad}`
  }));

  const sensorTypes = [
    { value: 'Temperature', label: 'Temperatura' },
    { value: 'Humidity', label: 'Humedad' },
    { value: 'Pressure', label: 'Presión' },
    { value: 'Wind', label: 'Viento' },
    { value: 'Rain', label: 'Lluvia' },
  ];

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sensores</h1>
          <p className="text-gray-600 mt-1">Gestiona los sensores de tus estaciones</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center space-x-2">
          <Plus className="h-5 w-5" /><span>Nuevo Sensor</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sensors.map((sensor) => (
          <div key={sensor.sensor_id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-purple-200 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-2 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-semibold text-purple-700">Sensor</span>
              </div>
              <div className="flex space-x-1">
                <button onClick={() => openModal(sensor)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(sensor.sensor_id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
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
                    <p className="font-semibold text-gray-700 text-sm">{sensor.sensor_id || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Radio className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-400">Estación</p>
                    <p className="font-semibold text-gray-700 text-sm">{sensor.id_estacion || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-400">Usuario</p>
                    <p className="font-semibold text-gray-700 text-sm">{sensor.username || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-xl">
                  <Database className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{editingSensor ? 'Editar' : 'Nuevo'} Sensor</h2>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="grid md:grid-cols-2 gap-4">

                <div className="md:col-span-2">
                  <InputField
                    label="Nombre del Sensor"
                    name="nombre_sensor"
                    register={register}
                    error={errors.nombre_sensor}
                    placeholder="Mi sensor"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <SelectField
                    label="Estación"
                    name="id_estacion"
                    register={register}
                    error={errors.id_estacion}
                    options={stationOptions}
                    placeholder="Seleccionar estación..."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <SelectField
                    label="Tipo de Sensor"
                    name="tipo_sensor"
                    register={register}
                    error={errors.tipo_sensor}
                    options={sensorTypes}
                    placeholder="Seleccionar tipo..."
                    required
                  />
                </div>

                <InputField
                  label="ID Sensor"
                  name="id_sensor"
                  register={register}
                  error={errors.id_sensor}
                  placeholder="Ej: TEMP001"
                />

                <InputField
                  label="Modelo"
                  name="model_sensor"
                  register={register}
                  error={errors.model_sensor}
                  placeholder="Ej: MA45"
                />

                <div className="md:col-span-2">
                  <InputField
                    label="Key"
                    name="key_sensor"
                    register={register}
                    error={errors.key_sensor}
                    placeholder="Clave o identificador único"
                  />
                </div>

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

                <InputField
                  label="Departamento"
                  name="departamento"
                  register={register}
                  error={errors.departamento}
                  placeholder="Departamento"
                />
                <InputField
                  label="Ciudad"
                  name="ciudad"
                  register={register}
                  error={errors.ciudad}
                  placeholder="Ciudad"
                />
                <InputField
                  label="País"
                  name="pais"
                  register={register}
                  error={errors.pais}
                  placeholder="País"
                />
                <InputField
                  label="Elevación (m)"
                  name="elevacion"
                  register={register}
                  error={errors.elevacion}
                  placeholder="Elevación"
                  helpText=" metros sobre el nivel del mar"
                />

              </div>

              <div className="mt-6">
                <FormButtons
                  submitLabel={editingSensor ? 'Actualizar' : 'Crear'}
                  submitLoading={isSubmitting}
                  onCancel={closeModal}
                />
              </div>
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
    </div>
  );
};

export default Sensors;
