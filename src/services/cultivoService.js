import api from './api';

export const cultivoService = {
  getAll: () => api.get('/cultivo'),
  
  getById: (id) => api.get(`/cultivo/${id}`),
  
  getByUsername: (username) => api.get(`/cultivo/user/${username}`),
  
  getActiveByUsername: (username) => api.get(`/cultivo/user/${username}/active`),
  
  getByStation: (idEstacion) => api.get(`/cultivo/station/${idEstacion}`),
  
  getBalanceHoy: (id) => api.get(`/cultivo/${id}/balance/hoy`),
  
  getBalanceFecha: (id, fecha) => api.get(`/cultivo/${id}/balance/fecha/${fecha}`),
  
  getBalanceRango: (id, fechaInicio, fechaFin) =>
    api.get(`/cultivo/${id}/balance/rango?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`),
  
  getInfoCultivo: (tipoCultivo) => api.get(`/cultivo/info/${tipoCultivo}`),
  
  create: (cultivo) => api.post('/cultivo', cultivo),
  
  update: (id, cultivo) => api.put(`/cultivo/${id}`, cultivo),
  
  toggle: (id) => api.patch(`/cultivo/${id}/toggle`),
  
  delete: (id) => api.delete(`/cultivo/${id}`),
};

export default cultivoService;
