import axios from 'axios';
import { io, Socket } from 'socket.io-client';

export const API_BASE_URL = 'http://localhost:5000/api';
export const SOCKET_BASE_URL = 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let storedAccessToken: string | null = null;
let storedRefreshToken: string | null = null;

export const setAuthTokens = (access: string | null, refresh: string | null) => {
  storedAccessToken = access;
  storedRefreshToken = refresh;
};

export const getAccessToken = () => storedAccessToken;
export const getRefreshToken = () => storedRefreshToken;

apiClient.interceptors.request.use(
  (config: any) => {
    if (storedAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${storedAccessToken}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      storedRefreshToken
    ) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken: storedRefreshToken,
        });
        const { accessToken } = res.data;
        setAuthTokens(accessToken, storedRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        setAuthTokens(null, null);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

let socketInstance: Socket | null = null;

export const initSocket = (token: string): Socket => {
  if (socketInstance) {
    socketInstance.disconnect();
  }
  socketInstance = io(SOCKET_BASE_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });
  return socketInstance;
};

export const getSocket = (): Socket | null => socketInstance;
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
