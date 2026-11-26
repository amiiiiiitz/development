import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Tokens are kept strictly in JS memory (never localStorage or sessionStorage)
let inMemoryAccessToken = null;
let inMemoryRefreshToken = null;
let onUnauthorizedCallback = null;
let refreshPromise = null;

export function setAuthTokens(accessToken, refreshToken) {
  inMemoryAccessToken = accessToken || null;
  if (refreshToken !== undefined) {
    inMemoryRefreshToken = refreshToken || null;
  }
}

export function clearAuthTokens() {
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

export function getRefreshToken() {
  return inMemoryRefreshToken;
}

export function registerUnauthorizedHandler(cb) {
  onUnauthorizedCallback = cb;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  if (inMemoryAccessToken) {
    config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/setup');

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthRoute &&
      inMemoryRefreshToken
    ) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              `${API_BASE_URL}/auth/refresh`,
              { refresh_token: inMemoryRefreshToken },
              { withCredentials: true }
            )
            .then((res) => {
              setAuthTokens(res.data.access_token, res.data.refresh_token);
              return res.data.access_token;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const newAccessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (_refreshErr) {
        clearAuthTokens();
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
      }
    }

    return Promise.reject(error);
  }
);

export function getApiBaseUrl() {
  return API_BASE_URL;
}
