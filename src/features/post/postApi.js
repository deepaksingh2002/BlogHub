import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${API}/api/v1/post`,
  withCredentials: true,
  timeout: 10000,
});

const likeApi = axios.create({
  baseURL: `${API}/api/v1/like`,
  withCredentials: true,
  timeout: 10000,
});

const attachAuthRefreshInterceptor = (client) => {
  client.interceptors.response.use(
    (response) => response.data,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest?._retry) {
        originalRequest._retry = true;
        try {
          await axios.post(
            `${API}/api/v1/users/refresh-token`,
            {},
            { withCredentials: true, timeout: 6000 }
          );
          return client(originalRequest);
        } catch (refreshError) {
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
};

attachAuthRefreshInterceptor(api);
attachAuthRefreshInterceptor(likeApi);

export const postService = {
  createPost: (postData) => api.post('/create-post', postData),
  getAllPosts: (params = {}) => api.get('/getAll-post', { params }),
  getPostById: (postId) => api.get(`/get-post/${postId}`),
  updatePost: (postId, postData) => api.patch(`/update-post/${postId}`, postData),
  deletePost: (postId) => api.delete(`/delete-post/${postId}`),
  searchPosts: (query) => api.get('/search', { params: { q: query } }),
};

export const likeService = {
  togglePostLike: (postId) => likeApi.post(`/toggle/post/${postId}`),
  toggleCommentLike: (commentId) => likeApi.post(`/toggle/comment/${commentId}`),
  getLikedPosts: () => likeApi.get('/liked/posts'),
};

export default api;
