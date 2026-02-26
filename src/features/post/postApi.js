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

const commentApi = axios.create({
  baseURL: `${API}/api/v1/comment`,
  withCredentials: true,
  timeout: 10000,
});

const refreshTokenWithFallback = async () => {
  const usersApi = axios.create({
    baseURL: `${API}/api/v1/users`,
    withCredentials: true,
    timeout: 10000,
  });

  const attempts = [
    { method: "post", url: "/refresh-token" },
    { method: "post", url: "/refreshToken" },
    { method: "get", url: "/refresh-token" },
  ];

  let lastError;
  for (const attempt of attempts) {
    try {
      if (attempt.method === "post") {
        await usersApi.post(attempt.url, {});
      } else {
        await usersApi.get(attempt.url);
      }
      return true;
    } catch (error) {
      lastError = error;
      const statusCode = error?.response?.status;
      // Invalid refresh session, stop fallback retries immediately.
      if (statusCode === 401 || statusCode === 403) break;
    }
  }

  throw lastError;
};

const attachAuthRefreshInterceptor = (client) => {
  client.interceptors.response.use(
    (response) => response.data,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest?._retry) {
        originalRequest._retry = true;
        try {
          await refreshTokenWithFallback();
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
attachAuthRefreshInterceptor(commentApi);

const requestWithFallback = async (client, attempts, data) => {
  let lastError;
  for (const attempt of attempts) {
    const method = attempt.method;
    const path = attempt.path;
    try {
      if (method === "get") return await client.get(path);
      if (method === "post") return await client.post(path, data);
      if (method === "put") return await client.put(path, data);
      if (method === "patch") return await client.patch(path, data);
      if (method === "delete") return await client.delete(path);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

export const postService = {
  createPost: (postData) => api.post('/create-post', postData),
  getAllPosts: (params = {}) => api.get('/getAll-post', { params }),
  getPostById: (postId) => api.get(`/get-post/${postId}`),
  updatePost: (postId, postData) => api.put(`/update-post/${postId}`, postData),
  deletePost: (postId) => api.delete(`/delete-post/${postId}`),
  searchPosts: (query) => api.get('/search-post', { params: { q: query } }),
};

export const likeService = {
  togglePostLike: (postId) =>
    requestWithFallback(likeApi, [
      { method: "post", path: `/posts/${postId}/toggle` },
      { method: "post", path: `/toggle/post/${postId}` },
      { method: "post", path: `/post/${postId}` },
      { method: "post", path: `/toggle/${postId}` },
      { method: "put", path: `/toggle/post/${postId}` },
    ]),
  toggleCommentLike: (commentId) =>
    requestWithFallback(likeApi, [
      { method: "post", path: `/comments/${commentId}/toggle` },
      { method: "post", path: `/toggle/comment/${commentId}` },
      { method: "post", path: `/comment/${commentId}` },
      { method: "post", path: `/toggle/${commentId}` },
      { method: "put", path: `/toggle/comment/${commentId}` },
    ]),
  getLikedPosts: async () => {
    try {
      return await likeApi.get("/posts");
    } catch {
      return likeApi.get("/liked/posts");
    }
  },
};

export const commentService = {
  getPostComments: (postId) =>
    requestWithFallback(commentApi, [
      { method: "get", path: `/post/${postId}` },
      { method: "get", path: `/posts/${postId}` },
      { method: "get", path: `/${postId}` },
    ]),
  createComment: (postId, data) =>
    requestWithFallback(commentApi, [
      { method: "post", path: `/post/${postId}` },
      { method: "post", path: `/posts/${postId}` },
      { method: "post", path: `/${postId}` },
      { method: "post", path: `/add-comment/${postId}` },
    ], data),
  updateComment: (commentId, data) =>
    requestWithFallback(commentApi, [
      { method: "patch", path: `/${commentId}` },
      { method: "patch", path: `/comment/${commentId}` },
      { method: "patch", path: `/update-comment/${commentId}` },
      { method: "put", path: `/${commentId}` },
    ], data),
  deleteComment: (commentId) =>
    requestWithFallback(commentApi, [
      { method: "delete", path: `/${commentId}` },
      { method: "delete", path: `/comment/${commentId}` },
      { method: "delete", path: `/delete-comment/${commentId}` },
    ]),
};

export default api;
