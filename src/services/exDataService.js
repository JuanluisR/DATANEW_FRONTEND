import api from './api';

const exDataService = {
  getLatestBySensor: (idSensor) => api.get(`/ex-data/sensor/${idSensor}/latest`),
  getBySensor: (idSensor) => api.get(`/ex-data/sensor/${idSensor}`),
  getByStation: (idEstacion) => api.get(`/ex-data/station/${idEstacion}`),
  create: (data) => api.post('/ex-data', data),
  delete: (id) => api.delete(`/ex-data/${id}`),
};

export default exDataService;
