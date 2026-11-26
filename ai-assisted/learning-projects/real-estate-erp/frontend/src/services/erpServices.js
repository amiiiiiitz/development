import { apiClient } from './apiClient';

export const authService = {
  getSetupStatus: async () => (await apiClient.get('/auth/setup-status')).data,
  setupInitialAdmin: async (payload) => (await apiClient.post('/auth/setup', payload)).data,
  login: async (payload) => (await apiClient.post('/auth/login', payload)).data,
  refresh: async (refreshToken) =>
    (await apiClient.post('/auth/refresh', { refresh_token: refreshToken })).data,
  logout: async (refreshToken) =>
    (await apiClient.post('/auth/logout', { refresh_token: refreshToken })).data,
  getMe: async () => (await apiClient.get('/auth/me')).data,
  changePassword: async (payload) =>
    (await apiClient.post('/auth/change-password', payload)).data,
};

export const employeesService = {
  listRoles: async () => (await apiClient.get('/employees/roles')).data,
  list: async (params) => (await apiClient.get('/employees', { params })).data,
  create: async (payload) => (await apiClient.post('/employees', payload)).data,
  update: async (id, payload) => (await apiClient.patch(`/employees/${id}`, payload)).data,
};

export const dashboardService = {
  get: async (params) => (await apiClient.get('/dashboard', { params })).data,
  getActivityLogs: async (params) => (await apiClient.get('/activity-logs', { params })).data,
};

export const projectsService = {
  list: async (params) => (await apiClient.get('/projects', { params })).data,
  get: async (id) => (await apiClient.get(`/projects/${id}`)).data,
  create: async (payload) => (await apiClient.post('/projects', payload)).data,
  update: async (id, payload) => (await apiClient.patch(`/projects/${id}`, payload)).data,
  archive: async (id) => (await apiClient.post(`/projects/${id}/archive`)).data,
  remove: async (id) => (await apiClient.delete(`/projects/${id}`)).data,
};

export const inventoryService = {
  list: async (params) => (await apiClient.get('/inventory', { params })).data,
  get: async (id) => (await apiClient.get(`/inventory/${id}`)).data,
  create: async (payload) => (await apiClient.post('/inventory', payload)).data,
  update: async (id, payload) => (await apiClient.patch(`/inventory/${id}`, payload)).data,
  changeStatus: async (id, payload) =>
    (await apiClient.post(`/inventory/${id}/status`, payload)).data,
};

export const customersService = {
  list: async (params) => (await apiClient.get('/customers', { params })).data,
  get: async (id) => (await apiClient.get(`/customers/${id}`)).data,
  getProfile: async (id) => (await apiClient.get(`/customers/${id}/profile`)).data,
  create: async (payload) => (await apiClient.post('/customers', payload)).data,
  update: async (id, payload) => (await apiClient.patch(`/customers/${id}`, payload)).data,
};

export const leadsService = {
  list: async (params) => (await apiClient.get('/leads', { params })).data,
  get: async (id) => (await apiClient.get(`/leads/${id}`)).data,
  create: async (payload) => (await apiClient.post('/leads', payload)).data,
  update: async (id, payload) => (await apiClient.patch(`/leads/${id}`, payload)).data,
  convert: async (id, payload) => (await apiClient.post(`/leads/${id}/convert`, payload)).data,
};

export const bookingsService = {
  list: async (params) => (await apiClient.get('/bookings', { params })).data,
  get: async (id) => (await apiClient.get(`/bookings/${id}`)).data,
  create: async (payload) => (await apiClient.post('/bookings', payload)).data,
  confirm: async (id) => (await apiClient.post(`/bookings/${id}/confirm`)).data,
  completeSale: async (id) => (await apiClient.post(`/bookings/${id}/complete-sale`)).data,
  cancel: async (id, payload) => (await apiClient.post(`/bookings/${id}/cancel`, payload)).data,
};

export const collectionsService = {
  list: async (params) => (await apiClient.get('/collections', { params })).data,
  getSummary: async (params) => (await apiClient.get('/collections/summary', { params })).data,
  get: async (id) => (await apiClient.get(`/collections/${id}`)).data,
  create: async (payload) => (await apiClient.post('/collections', payload)).data,
  reverse: async (id, payload) =>
    (await apiClient.post(`/collections/${id}/reverse`, payload)).data,
};

export const complaintsService = {
  list: async (params) => (await apiClient.get('/complaints', { params })).data,
  get: async (id) => (await apiClient.get(`/complaints/${id}`)).data,
  create: async (payload) => (await apiClient.post('/complaints', payload)).data,
  update: async (id, payload) => (await apiClient.patch(`/complaints/${id}`, payload)).data,
};

export const reportsService = {
  get: async (reportType, params) =>
    (await apiClient.get(`/reports/${reportType}`, { params })).data,
  exportCsv: async (reportType, params) => {
    const response = await apiClient.get(`/reports/${reportType}/export`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
