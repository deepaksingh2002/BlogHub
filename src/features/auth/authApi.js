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
});

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
        await refreshApi.post("/refresh-token");
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
  changeUserPassword: (data) => api.patch("/forget-password", data),
  refreshToken: () => api.post("/refresh-token"),
};

export default api;
