import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${API}/api/v1/users`,
  withCredentials: true,
  timeout: 10000,
});

const refreshApi = axios.create({
  baseURL: `${API}/api/v1/users`,
  withCredentials: true,
  timeout: 10000,
});

const refreshAccessToken = async () => {
  await refreshApi.post("/refresh-token", {});
};

// Auth client interceptor:
// - retries once after refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    if (!originalRequest) return Promise.reject(error);

    const requestUrl = originalRequest.url || "";
    const isRefreshCall = requestUrl.includes("/refresh-token");
    const isPublicAuthCall =
      requestUrl.includes("/login") || requestUrl.includes("/register");

    if (isRefreshCall || isPublicAuthCall || originalRequest?.skipAuthRefresh) {
      return Promise.reject(error);
    }

    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await refreshAccessToken();
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const AuthService = {
  register: (data) => api.post("/register", data),
  login: (data) => api.post("/login", data),
  logout: () => api.post("/logout"),
  applyForAuthor: (data) => api.post("/apply-author", data),
  forgotPassword: async (data) => {
    const endpoints = ["/forgot-password", "/forgotPassword"];
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        return await api.post(endpoint, data, { skipAuthRefresh: true });
      } catch (error) {
        const status = error?.response?.status;
        if (status === 404) {
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    throw lastError || new Error("Forgot password endpoint not found");
  },
  currentUser: (config = {}) => api.get("/currentUser", config),
  getUserProfile: () => api.get("/profile"),
  updateUserProfile: (_user, data) => api.patch("/update-profile", data),
  updateUserAvatar: (_user, formData) =>
    api.patch("/update-avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  changeUserPassword: (_user, data) => api.patch("/change-password", data),
  refreshToken: () => refreshAccessToken(),
};

export default api;
