import api from '../api';

const MesureService = {
    getAll:         ()                       => api.get('/measures'),
    getById:        (id)                     => api.get(`/measures/${id}`),
    create:         (data)                   => api.post('/measures', data),
    update:         (id, data)               => api.put(`/measures/${id}`, data),
    delete:         (id)                     => api.delete(`/measures/${id}`),
    toggle:         (id)                     => api.patch(`/measures/${id}/toggle`, {}),

    // Dashboard stats
    getStats:       ()                       => api.get('/measures/stats'),

    // Résultats
    saveResult:     (measureId, value, note) => api.post('/measures/result', { measure_id: measureId, value, note }),
    updateResult:   (resultId, value, note)  => api.put(`/measures/results/${resultId}`, { value, note }),
    deleteResult:   (resultId)               => api.delete(`/measures/results/${resultId}`),
};

export default MesureService;