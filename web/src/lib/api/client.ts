import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  clearAuthSession,
  readStoredToken,
  updateStoredTokens,
} from '@/lib/auth/auth-storage';

const DEFAULT_API_URL = 'http://localhost:3100/api';
const browserBaseURL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
const serverBaseURL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
const resolvedBaseURL = typeof window === 'undefined' ? serverBaseURL : browserBaseURL;

const apiClient: AxiosInstance = axios.create({
  baseURL: resolvedBaseURL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string | number;
};

let refreshPromise: Promise<string | null> | null = null;

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = readStoredToken();
    if (token && config.headers && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const requestConfig = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      requestConfig &&
      !requestConfig._retry &&
      canAttemptTokenRefresh(requestConfig)
    ) {
      requestConfig._retry = true;

      const nextAccessToken = await refreshAccessToken();
      if (nextAccessToken) {
        requestConfig.headers = requestConfig.headers ?? {};
        requestConfig.headers.Authorization = `Bearer ${nextAccessToken}`;
        return apiClient(requestConfig);
      }
    }

    if (error.response?.status === 403) {
      console.error('Acesso negado:', error.response.data);
    }

    if (error.response?.status === 401) {
      clearAuthSession();
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const api = {
  get: async <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    (await apiClient.get<T>(url, config)).data,

  post: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> => (await apiClient.post<T>(url, data, config)).data,

  put: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> => (await apiClient.put<T>(url, data, config)).data,

  patch: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> => (await apiClient.patch<T>(url, data, config)).data,

  delete: async <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    (await apiClient.delete<T>(url, config)).data,
};

export default apiClient;

function canAttemptTokenRefresh(config: RetryableRequestConfig): boolean {
  const targetUrl = `${config.baseURL ?? ''}${config.url ?? ''}`;
  return !['/auth/login', '/auth/register', '/auth/register/admin', '/auth/refresh'].some((path) =>
    targetUrl.includes(path),
  );
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = axios
    .post<RefreshResponse>(
      `${resolvedBaseURL}/auth/refresh`,
      {},
      {
        timeout: 10000,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    .then(({ data }) => {
      if (!data.accessToken) {
        throw new Error('Resposta de refresh inválida.');
      }

      updateStoredTokens(data.accessToken);
      return data.accessToken;
    })
    .catch(() => {
      clearAuthSession();
      redirectToLogin();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

function redirectToLogin() {
  if (typeof window === 'undefined') {
    return;
  }

  if (!window.location.pathname.startsWith('/auth/login')) {
    window.location.href = '/auth/login';
  }
}
