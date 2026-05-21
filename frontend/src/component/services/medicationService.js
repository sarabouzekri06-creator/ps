import api from '../api';

const MedicationService = {
    getAll:     ()             => api.get('/medications'),
    getById:    (id)           => api.get(`/medications/${id}`),
    create:     (data)         => api.post('/medications', data),
    update:     (id, data)     => api.put(`/medications/${id}`, data),
    updateForm: (id, data)     => api.post(`/medications/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete:     (id)           => api.delete(`/medications/${id}`),
    toggle:     (id)           => api.patch(`/medications/${id}/toggle`, {}),
    restock:    (id, quantity) => api.post(`/medications/${id}/restock`, { quantity }),
};

export default MedicationService;