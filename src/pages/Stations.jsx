import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useStations, StationCard, StationMap, StationModal, StationDetailsModal, StationSensors, SensorDetailModal } from '../components/stations';
import { Plus, Radio } from 'lucide-react';

const Stations = () => {
  const { user } = useAuth();
  const toast = useToast();
  
  const {
    stations,
    subscription,
    allSensors,
    stationStats,
    loading,
    hasReachedLimit,
    createStation,
    updateStation,
    deleteStation,
    getClimateStats,
    getStationHistory,
    getStationSensors,
    geocode,
    getWeatherlinkDevices
  } = useStations(user);

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSensorDetailModal, setShowSensorDetailModal] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedSensor, setSelectedSensor] = useState(null);

  const handleOpenModal = (station = null) => {
    setEditingStation(station);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStation(null);
  };

  const handleSubmit = async (data) => {
    try {
      if (editingStation) {
        await updateStation(editingStation.id, data);
        toast.success('Estación actualizada correctamente');
      } else {
        await createStation(data);
        toast.success('Estación creada correctamente');
      }
    } catch (error) {
      console.error('Error al guardar estación:', error);
      toast.error('Error al guardar estación: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    await deleteStation(id);
  };

  const handleViewDetails = (station) => {
    setSelectedStation(station);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedStation(null);
  };

  const handleSensorClick = (sensor) => {
    setSelectedSensor(sensor);
    setShowSensorDetailModal(true);
  };

  const handleCloseSensorDetailModal = () => {
    setShowSensorDetailModal(false);
    setSelectedSensor(null);
  };

  const handleGeocode = async (lat, lon, setValue, watch) => {
    try {
      const data = await geocode(lat, lon);
      if (data) {
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
      }
    } catch (err) {
      console.error('Error en geocodificación inversa:', err);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <StationMap 
        stations={stations} 
        stationStats={stationStats} 
        onStationClick={handleViewDetails}
      />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Estaciones</h2>
          <p className="text-gray-600 mt-1">Gestiona tus estaciones meteorológicas</p>
        </div>
        {!hasReachedLimit && (
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center space-x-2">
            <Plus className="h-5 w-5" /><span>Nueva Estación</span>
          </button>
        )}
      </div>

      {stations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <Radio className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No tienes estaciones</h3>
          <p className="text-gray-500 mb-6">Comienza agregando tu primera estación meteorológica</p>
          {!hasReachedLimit && (
            <button onClick={() => handleOpenModal()} className="btn-primary inline-flex items-center space-x-2">
              <Plus className="h-5 w-5" /><span>Crear Primera Estación</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              stats={stationStats[station.id_estacion]}
              onEdit={handleOpenModal}
              onDelete={handleDelete}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      <StationSensors 
        sensors={allSensors}
        stations={stations}
        stationStats={stationStats}
        onSensorClick={handleSensorClick}
      />

      <StationModal
        key={editingStation?.id ?? 'new'}
        isOpen={showModal}
        onClose={handleCloseModal}
        editingStation={editingStation}
        onSubmit={handleSubmit}
        username={user?.username}
        onGeocode={handleGeocode}
        onGetWeatherlinkDevices={getWeatherlinkDevices}
      />

      <StationDetailsModal
        station={selectedStation}
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        onGetClimateStats={getClimateStats}
        onGetHistory={getStationHistory}
        onGetSensors={getStationSensors}
      />

      <SensorDetailModal
        sensor={selectedSensor}
        station={selectedSensor ? stations.find(s => s.id_estacion === selectedSensor?.id_estacion) : null}
        isOpen={showSensorDetailModal}
        onClose={handleCloseSensorDetailModal}
      />
    </div>
  );
};

export default Stations;
