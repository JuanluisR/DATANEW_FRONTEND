import api from './api';

const mlService = {
  predict: (idEstacion) =>
    api.get(`/ml/predict/${idEstacion}`),

  train: (idEstacion) =>
    api.post(`/ml/train/${idEstacion}`),

  health: () =>
    api.get('/ml/health'),
};

export default mlService;
