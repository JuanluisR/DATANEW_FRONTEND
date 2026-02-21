import api from './api';

export const sensorService = {
  getAll: () => api.get('/sensores'),
  
  getById: (id) => api.get(`/sensores/${id}`),
  
  getByStation: (idEstacion) => api.get(`/sensores/station/${idEstacion}`),
  
  create: (sensor) => api.post('/sensores', sensor),
  
  update: (id, sensor) => api.put(`/sensores/${id}`, sensor),
  
  delete: (id) => api.delete(`/sensores/${id}`),
};

export default sensorService;
