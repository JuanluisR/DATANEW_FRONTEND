import api, { API_BASE_URL } from './api';

export const userService = {
  getAll: () => api.get('/user'),
  
  getById: (id) => api.get(`/user/${id}`),
  
  create: (user) => axios.post(`${API_BASE_URL}/user`, user, {
    headers: { 'Content-Type': 'application/json' }
  }),
  
  update: (id, user) => api.put(`/user/${id}`, user),
  
  delete: (id) => api.delete(`/user/${id}`),
};

import axios from 'axios';
export default userService;
