import api from './api';

export const apiKeyService = {
  generate: (idEstacion, username) => 
    api.post(`/api-key/generate?idEstacion=${idEstacion}&username=${username}`),
  
  getByUsername: (username) => api.get(`/api-key/user/${username}`),
  
  toggle: (id) => api.patch(`/api-key/${id}/toggle`),
  
  delete: (id) => api.delete(`/api-key/${id}`),
};

export default apiKeyService;
