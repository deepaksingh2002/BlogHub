import axios from "axios";
import { runRefreshWithBackoff } from "../../lib/refreshTokenGuard";
import {
  buildRefreshPayload,
  createAuthClient,
  refreshSessionTokens,
} from "../auth/authSession";

const API = import.meta.env.VITE_API_URL;

const usersApi = createAuthClient({
  baseURL: `${API}/api/v1/users`,
  timeout: 10000,
});

const subscriptionsApi = createAuthClient({
  baseURL: `${API}/api/v1/subscriptions`,
  timeout: 10000,
});

const refreshApi = createAuthClient({
  baseURL: `${API}/api/v1/users`,
  timeout: 10000,
});

const refreshAccessToken = async () => {
  await runRefreshWithBackoff(() =>
    refreshSessionTokens(() => refreshApi.post("/refresh-token", buildRefreshPayload()))
  );
};

const normalizeError = (error) => ({
  code: error?.code || null,
  statusCode: error?.response?.status || null,
  message: error?.response?.data?.message || error?.message || "Request failed",
  data: error?.response?.data || null,
});

const attachAuthRetry = (client) => {
  client.interceptors.response.use(
    (response) => response.data,
    async (error) => {
      const originalRequest = error?.config;
      if (!originalRequest) return Promise.reject(normalizeError(error));

      const requestUrl = originalRequest.url || "";
      const isRefreshCall = requestUrl.includes("/refresh-token");
      if (isRefreshCall || originalRequest?.skipAuthRefresh) {
        return Promise.reject(normalizeError(error));
      }

      if (error?.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          await refreshAccessToken();
          return client(originalRequest);
        } catch (refreshError) {
          return Promise.reject(normalizeError(refreshError));
        }
      }

      return Promise.reject(normalizeError(error));
    }
  );
};

attachAuthRetry(usersApi);
attachAuthRetry(subscriptionsApi);

export const subscriptionService = {
  getAuthors: () => usersApi.get("/authors"),
  toggleFollow: (channelId) => subscriptionsApi.post(`/c/${channelId}`),
};

export default subscriptionService;
