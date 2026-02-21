import api from './api';

export const subscriptionService = {
  getAll: () => api.get('/subscription'),
  
  getPlans: () => api.get('/subscription/plans'),
  
  getById: (id) => api.get(`/subscription/${id}`),
  
  getByUsername: (username) => api.get(`/subscription/user/${username}`),
  
  create: (subscription) => api.post('/subscription', subscription),
  
  update: (id, subscription) => api.put(`/subscription/${id}`, subscription),
  
  updateCompanyInfo: (username, companyName, companyLogoUrl) =>
    api.patch(`/subscription/user/${username}/company`, { companyName: companyName || '', companyLogoUrl: companyLogoUrl || '' }),
  
  upgradePlan: (username, plan) => api.patch(`/subscription/user/${username}/upgrade?plan=${plan}`),
  
  delete: (id) => api.delete(`/subscription/${id}`),
};

export default subscriptionService;
