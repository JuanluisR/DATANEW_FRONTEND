import { useState, useEffect } from 'react';
import { useZodForm, InputField, SelectField, FormButtons, z } from '../../components/FormFields';
import { useDebounce } from '../../components/FormFields';
import { X, MapPin, MapPinned, Search, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';

const MapFlyTo = ({ lat, lon, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], zoom, { duration: 0.8 });
  }, [lat, lon, zoom]);
  return null;
};
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  tipo_estacion: z.string().optional(),
});

const tiposEstacion = [
  { value: 'Meteorologica', label: 'Meteorológica' },
  { value: 'Hidrometeorologica', label: 'Hidrometeorológica' },
  { value: 'Otras', label: 'Otras' },
];

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

const StationModal = ({ 
  isOpen, 
  onClose, 
  editingStation, 
  onSubmit, 
  username,
  onGeocode,
  onGetWeatherlinkDevices 
}) => {
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCenter, setMapCenter] = useState([4.5, -74.0]);
  const [mapZoom, setMapZoom] = useState(6);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [weatherlinkDevices, setWeatherlinkDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const defaultValues = {
    nombre_estacion: '', lat: '', lon: '', departamento: '', ciudad: '', pais: '',
    elevacion: '', altura_suelo: '',
    key: '', username: username || '', freq: '915', marca: '', modelo: '', id_estacion: '',
    passkey: '', imei: '', api_key: '', api_secret: '', weatherlink_id: '', tipo_estacion: ''
  };

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useZodForm(
    editingStation ? {
      nombre_estacion: editingStation.nombre_estacion || '',
      lat: editingStation.lat || '',
      lon: editingStation.lon || '',
      departamento: editingStation.departamento || '',
      ciudad: editingStation.ciudad || '',
      pais: editingStation.pais || '',
      elevacion: editingStation.elevacion || '',
      altura_suelo: editingStation.altura_suelo || editingStation.altura || '',
      key: editingStation.key || '',
      username: editingStation.username || username || '',
      freq: editingStation.freq || '915',
      marca: editingStation.marca || '',
      modelo: editingStation.modelo || '',
      id_estacion: editingStation.id_estacion || '',
      passkey: editingStation.passkey || '',
      imei: editingStation.imei || '',
      api_key: editingStation.api_key || '',
      api_secret: editingStation.api_secret || '',
      weatherlink_id: editingStation.weatherlink_id || '',
      tipo_estacion: editingStation.tipo_estacion || ''
    } : defaultValues,
    stationSchema
  );

  const watchMarca = watch('marca');
  const watchModelo = watch('modelo');
  const watchLat = watch('lat');
  const watchLon = watch('lon');
  const debouncedLat = useDebounce(watchLat, 1000);
  const debouncedLon = useDebounce(watchLon, 1000);

  useEffect(() => {
    if (editingStation) {
      setWeatherlinkDevices([]);
      reset({
        nombre_estacion: editingStation.nombre_estacion || '',
        lat: editingStation.lat || '',
        lon: editingStation.lon || '',
        departamento: editingStation.departamento || '',
        ciudad: editingStation.ciudad || '',
        pais: editingStation.pais || '',
        elevacion: editingStation.elevacion || '',
        altura_suelo: editingStation.altura_suelo || editingStation.altura || '',
        key: editingStation.key || '',
        username: editingStation.username || username || '',
        freq: editingStation.freq || '915',
        marca: editingStation.marca || '',
        modelo: editingStation.modelo || '',
        id_estacion: editingStation.id_estacion || '',
        passkey: editingStation.passkey || '',
        imei: editingStation.imei || '',
        api_key: editingStation.api_key || '',
        api_secret: editingStation.api_secret || '',
        weatherlink_id: editingStation.weatherlink_id || '',
      tipo_estacion: editingStation.tipo_estacion || ''
      });
    } else {
      setWeatherlinkDevices([]);
      reset(defaultValues);
    }
  }, [editingStation, isOpen]);

  useEffect(() => {
    if (editingStation) return;

    const lat = parseFloat(debouncedLat);
    const lon = parseFloat(debouncedLon);

    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && (lat !== 0 || lon !== 0)) {
      setMapCenter([lat, lon]);
      setMapZoom(14);
      setMarkerPosition([lat, lon]);
      onGeocode(lat, lon, setValue, watch);
    }
  }, [debouncedLat, debouncedLon, editingStation]);

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
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setMapCenter([lat, lon]);
    setMapZoom(15);
    setMarkerPosition([lat, lon]);
    setValue('lat', lat.toFixed(5));
    setValue('lon', lon.toFixed(5));
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
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
      },
      () => setGettingLocation(false),
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

  const handleConsultWeatherlink = async () => {
    const apiKey = watch('api_key');
    const apiSecret = watch('api_secret');
    if (!apiKey || !apiSecret) return;
    try {
      setLoadingDevices(true);
      const devices = await onGetWeatherlinkDevices(apiKey, apiSecret);
      setWeatherlinkDevices(devices);
    } catch (error) {
      console.error('Error consultando dispositivos:', error);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleClose = () => {
    setShowMapPicker(false);
    setWeatherlinkDevices([]);
    onClose();
  };

  const showPasskey = watchMarca === 'Meteoagro' && 
    ['MA9000', 'MA2300', 'MA1000', 'MA1000 sensor', 'MA2000', 'MA3000', 'MA6200'].includes(watchModelo);
  
  const showImei = watchMarca === 'Meteoagro' && watchModelo === 'MA6000';
  
  const showWeatherlink = watchMarca === 'Davis' && 
    ['Vantage Pro2 Plus', 'Vantage Pro2'].includes(watchModelo);

  const onFormSubmit = async (data) => {
    await onSubmit(data);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 overflow-x-hidden">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
            <h2 className="text-2xl font-bold">{editingStation ? 'Editar' : 'Nueva'} Estación</h2>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-6 w-6" /></button>
          </div>
          <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4">
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
                  label="Tipo de Estación"
                  name="tipo_estacion"
                  register={register}
                  error={errors.tipo_estacion}
                  options={tiposEstacion}
                  placeholder="Seleccionar tipo..."
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
                    <div className="md:col-span-2">
                      <SelectField
                        label="Seleccionar Dispositivo"
                        name="weatherlink_id"
                        register={register}
                        error={errors.weatherlink_id}
                        options={weatherlinkDevices.map(d => ({ value: d.station_id, label: `${d.station_name} (ID: ${d.station_id})` }))}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            <FormButtons
              submitLabel={editingStation ? 'Actualizar' : 'Crear'}
              submitLoading={isSubmitting}
              onCancel={handleClose}
            />
          </form>
        </div>
      </div>

      {showMapPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-green-600 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPinned className="h-5 w-5" />
                Seleccionar ubicación
              </h2>
              <button onClick={() => setShowMapPicker(false)} className="p-1 hover:bg-green-700 rounded">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
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
                  <MapFlyTo lat={mapCenter[0]} lon={mapCenter[1]} zoom={mapZoom} />
                  {markerPosition && (
                    <Marker position={markerPosition} draggable={true} eventHandlers={{ dragend: (e) => {
                      const { lat, lng } = e.target.getLatLng();
                      setValue('lat', lat.toFixed(5));
                      setValue('lon', lng.toFixed(5));
                    }}} />
                  )}
                </MapContainer>
              </div>

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
    </>
  );
};

export default StationModal;
