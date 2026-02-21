import api from './api';

export const forecastService = {
  getForecast: (lat, lon) => api.get(`/forecast?lat=${lat}&lon=${lon}`),
};

export default forecastService;
