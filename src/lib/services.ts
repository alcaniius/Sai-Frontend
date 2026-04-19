import { api } from '@/lib/api';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
}

export const authService = {
  async login(data: LoginInput) {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterInput) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

export const documentsService = {
  async getAll() {
    const response = await api.get('/documents');
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/documents', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.patch(`/documents/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  async approve(id: string, action: 'APPROVED' | 'REJECTED', comment?: string) {
    const response = await api.post(`/documents/${id}/approve`, { action, comment });
    return response.data;
  },
};

export const environmentalService = {
  getAspects: async () => {
    const response = await api.get('/environmental/aspects');
    return response.data;
  },
  getAspectById: async (id: string) => {
    const response = await api.get(`/environmental/aspects/${id}`);
    return response.data;
  },
  createAspect: async (data: any) => {
    const response = await api.post('/environmental/aspects', data);
    return response.data;
  },
  updateAspect: async (id: string, data: any) => {
    const response = await api.patch(`/environmental/aspects/${id}`, data);
    return response.data;
  },
  deleteAspect: async (id: string) => {
    const response = await api.delete(`/environmental/aspects/${id}`);
    return response.data;
  },
  recalculateSignificance: async (id: string) => {
    const response = await api.post(`/environmental/aspects/${id}/significance`);
    return response.data;
  },
  getPMAs: async () => {
    const response = await api.get('/environmental/pma');
    return response.data;
  },
  createPMA: async (data: any) => {
    const response = await api.post('/environmental/pma', data);
    return response.data;
  },
  getANLAReports: async () => {
    const response = await api.get('/environmental/anla');
    return response.data;
  },
  createANLAReport: async (data: any) => {
    const response = await api.post('/environmental/anla', data);
    return response.data;
  },
};
