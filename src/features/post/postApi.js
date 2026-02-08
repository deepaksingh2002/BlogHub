import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${API}/api/v1/post`,
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response.data, 
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${API}/api/v1/users/refresh-token`,
          {},
          { withCredentials: true }
        );
        return api(originalRequest);
      } catch (refreshError) {
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject({
      statusCode: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data || null,
    });
  }
);

export const postService = {
  createPost: (postData) => api.post('/create-post', postData),
  getAllPosts: (params = {}) => api.get('/getAll-post', { params }),
  getPostById: (postId) => api.get(`/get-post/${postId}`),
  updatePost: (postId, postData) => api.patch(`/update-post/${postId}`, postData),
  deletePost: (postId) => api.delete(`/delete-post/${postId}`),
  searchPosts: (query) => api.get("/search", { params: { q: query } }),
};

export default api;
