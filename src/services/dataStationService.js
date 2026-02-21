import api from './api';

export const dataStationService = {
  getAll: () => api.get('/data'),
  
  getById: (id) => api.get(`/data/${id}`),
  
  getLatestByIdEstacion: (idEstacion) => api.get(`/data/latest/${idEstacion}`),
  
  getClimateStats: (idEstacion) => api.get(`/data/stats/${idEstacion}`),
  
  queryByDateRange: (idEstacion, startDate, endDate) =>
    api.get(`/data/query/${idEstacion}?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`),
  
  create: (data) => api.post('/data', data),
  
  update: (id, data) => api.put(`/data/${id}`, data),
  
  delete: (id) => api.delete(`/data/${id}`),
  
  uploadExcel: (formData) => api.post('/data/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  getTemplate: () => api.get('/data/template'),
};

export default dataStationService;
