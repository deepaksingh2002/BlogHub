import axios from "axios";
import { runRefreshWithBackoff } from "../../lib/refreshTokenGuard";

const API = import.meta.env.VITE_API_URL || "";

const authorApi = axios.create({
  baseURL: `${API}/api/v1/author`,
  withCredentials: true,
  timeout: 30000,
});

const refreshApi = axios.create({
  baseURL: `${API}/api/v1/users`,
  withCredentials: true,
  timeout: 10000,
});

const refreshAccessToken = async () => {
  await runRefreshWithBackoff(() => refreshApi.post("/refresh-token", {}));
};

const normalizeError = (error) => {
  const data = error?.response?.data || null;
  return {
    code: error?.code || null,
    statusCode: error?.response?.status || null,
    message: data?.message || error?.message || "Request failed",
    fieldErrors: data?.errors || data?.fieldErrors || data?.validationErrors || null,
    data,
  };
};

authorApi.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error?.config;
    if (!originalRequest) return Promise.reject(normalizeError(error));

    const isRefreshCall = originalRequest.url?.includes("/refresh-token");
    if (isRefreshCall || originalRequest.skipAuthRefresh) {
      return Promise.reject(normalizeError(error));
    }

    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await refreshAccessToken();
        return authorApi(originalRequest);
      } catch (refreshError) {
        return Promise.reject(normalizeError(refreshError));
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

export const authorService = {
  getDashboard: () => authorApi.get("/dashboard"),
  getProfile: () => authorApi.get("/profile"),
  getManagedPosts: () => authorApi.get("/posts/manage"),
};

export default authorService;
