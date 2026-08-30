import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PROD_URL = 'https://meshx.onrender.com';

const getBackendUrl = (): { apiUrl: string; socketUrl: string } => {
  if (__DEV__) {
    // In local development, prefer the Metro host URI / ADB reverse localhost / 10.0.2.2 for Android
    const hostUri = Constants.expoConfig?.hostUri;
    const devHost = hostUri
      ? hostUri.split(':')[0]
      : Platform.OS === 'android'
      ? '10.0.2.2'
      : 'localhost';
    const localUrl = `http://${devHost}:5000`;
    return {
      apiUrl: `${localUrl}/api`,
      socketUrl: localUrl,
    };
  }
  return {
    apiUrl: `${PROD_URL}/api`,
    socketUrl: PROD_URL,
  };
};

const urls = getBackendUrl();
export const API_BASE_URL = urls.apiUrl;
export const SOCKET_BASE_URL = urls.socketUrl;

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
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
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
