import { useState, useEffect, useCallback } from 'react';
import stationService from '../../services/stationService';
import dataStationService from '../../services/dataStationService';
import subscriptionService from '../../services/subscriptionService';
import sensorService from '../../services/sensorService';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';

const EXCLUDED_STATIONS = ['AAAAAAABC', 'COLCOMO12', 'COLBOLMA01'];

export const useStations = (user) => {
  const toast = useToast();
  const confirm = useConfirm();
  
  const [stations, setStations] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [allSensors, setAllSensors] = useState([]);
  const [stationStats, setStationStats] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.username) return;
    
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

      const stationList = stationsRes.data;
      if (stationList.length > 0) {
        const stationsWithData = stationList.filter(s => 
          !EXCLUDED_STATIONS.includes(s.id_estacion)
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
  }, [user?.username]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createStation = async (data) => {
    await stationService.create({
      ...data,
      weatherlink_id: data.weatherlink_id || null
    });
    fetchData();
  };

  const updateStation = async (id, data) => {
    await stationService.update(id, {
      ...data,
      weatherlink_id: data.weatherlink_id || null
    });
    fetchData();
  };

  const deleteStation = async (id) => {
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

  const getClimateStats = async (stationId) => {
    try {
      const response = await dataStationService.getClimateStats(stationId);
      return response.data;
    } catch (error) {
      console.error('Error al cargar datos climáticos:', error);
      return null;
    }
  };

  const getStationHistory = async (stationId, startDate, endDate) => {
    try {
      const response = await dataStationService.queryByDateRange(stationId, startDate, endDate);
      return response.data || [];
    } catch (error) {
      console.error('Error al cargar datos del día:', error);
      return [];
    }
  };

  const getStationSensors = async (stationId) => {
    try {
      const response = await sensorService.getByStation(stationId);
      return response.data || [];
    } catch (error) {
      console.error('Error al cargar sensores:', error);
      return [];
    }
  };

  const geocode = async (lat, lon) => {
    try {
      const response = await stationService.geocode(lat, lon);
      return response.data;
    } catch (error) {
      console.error('Error en geocodificación:', error);
      return null;
    }
  };

  const getWeatherlinkDevices = async (apiKey, apiSecret) => {
    const response = await stationService.getWeatherlinkDevices(apiKey, apiSecret);
    return response.data;
  };

  const hasReachedLimit = subscription && 
    subscription.maxStations !== -1 && 
    stations.length >= subscription.maxStations;

  return {
    stations,
    subscription,
    allSensors,
    stationStats,
    loading,
    hasReachedLimit,
    fetchData,
    createStation,
    updateStation,
    deleteStation,
    getClimateStats,
    getStationHistory,
    getStationSensors,
    geocode,
    getWeatherlinkDevices
  };
};

export default useStations;
