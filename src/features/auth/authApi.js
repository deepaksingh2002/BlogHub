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

const refreshTokenWithFallback = async () => {
  const attempts = [
    { method: "post", url: "/refresh-token" },
    { method: "post", url: "/refreshToken" },
    { method: "get", url: "/refresh-token" },
  ];

  let lastError;
  for (const attempt of attempts) {
    try {
      if (attempt.method === "post") {
        await refreshApi.post(attempt.url, {});
      } else {
        await refreshApi.get(attempt.url);
      }
      return true;
    } catch (error) {
      lastError = error;
      const statusCode = error?.response?.status;
      // 401/403 means token is invalid/missing; extra endpoint retries won't help.
      if (statusCode === 401 || statusCode === 403) break;
    }
  }

  throw lastError;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (originalRequest?.skipAuthRefresh) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/refresh-token")) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        await refreshTokenWithFallback();
        return api(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export const AuthService = {
  register: (data) => api.post("/register", data),
  login: (data) => api.post("/login", data),
  logout: () => api.post("/logout"),
  currentUser: (config = {}) => api.get("/currentUser", config),
  getUserProfile: () => api.get("/profile"),
  updateUserProfile: (data) => api.patch("/update-profile", data),
  updateUserAvatar: (formData) =>
    api.patch("/update-avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  changeUserPassword: (data) => api.patch("/change-password", data),
  refreshToken: () => refreshTokenWithFallback(),
};

export default api;
