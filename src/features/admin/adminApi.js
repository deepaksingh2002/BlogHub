import axios from "axios";
import { runRefreshWithBackoff } from "../../lib/refreshTokenGuard";

const API = import.meta.env.VITE_API_URL || "";

const adminApi = axios.create({
  baseURL: `${API}/api/v1/admin`,
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

adminApi.interceptors.response.use(
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
        return adminApi(originalRequest);
      } catch (refreshError) {
        return Promise.reject(normalizeError(refreshError));
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

export const adminService = {
  getDashboard: () => adminApi.get("/dashboard"),
  getProfile: () => adminApi.get("/profile"),
  getUsers: (params = {}) => adminApi.get("/users", { params }),
  getUserProfile: (userId) => adminApi.get(`/users/${userId}`),
  getModerationLogs: () => adminApi.get("/moderation-logs"),
  getAuthorApplications: () => adminApi.get("/author-applications"),
  approveAuthorApplication: (userId) =>
    adminApi.patch(`/author-applications/${userId}/approve`),
  rejectAuthorApplication: (userId, reason) =>
    adminApi.patch(`/author-applications/${userId}`, {
      status: "rejected",
      reason,
    }),
  deleteAnyPost: (postId) => adminApi.delete(`/posts/${postId}`),
  deleteAnyComment: (commentId) => adminApi.delete(`/comments/${commentId}`),
  deleteUser: (userId) => adminApi.delete(`/users/${userId}`),
};

export default adminService;
