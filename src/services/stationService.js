import api from './api';

export const stationService = {
  getAll: () => api.get('/station'),
  
  getById: (id) => api.get(`/station/${id}`),
  
  getByUsername: (username) => api.get(`/station/userstation?username=${username}`),
  
  create: (station) => api.post('/station', station),
  
  update: (id, station) => api.put(`/station/${id}`, station),
  
  delete: (id) => api.delete(`/station/${id}`),
  
  getWeatherlinkDevices: (apiKey, apiSecret) => 
    api.get(`/station/weatherlink/devices?apiKey=${apiKey}&apiSecret=${apiSecret}`),
    
  geocode: (lat, lon) => api.get(`/station/geocode?lat=${lat}&lon=${lon}`),
};

export default stationService;
