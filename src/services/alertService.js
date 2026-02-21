import api from './api';

export const alertService = {
  getAll: () => api.get('/alert'),
  
  getById: (id) => api.get(`/alert/${id}`),
  
  getByUsername: (username) => api.get(`/alert/user/${username}`),
  
  getActiveByUsername: (username) => api.get(`/alert/user/${username}/active`),
  
  getByStation: (idEstacion) => api.get(`/alert/station/${idEstacion}`),
  
  getActiveByStation: (idEstacion) => api.get(`/alert/station/${idEstacion}/active`),
  
  getAllActive: () => api.get('/alert/active'),
  
  create: (alert) => api.post('/alert', alert),
  
  update: (id, alert) => api.put(`/alert/${id}`, alert),
  
  toggle: (id) => api.patch(`/alert/${id}/toggle`),
  
  delete: (id) => api.delete(`/alert/${id}`),
};

export default alertService;
