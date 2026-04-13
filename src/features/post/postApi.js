import axios from "axios";
import { runRefreshWithBackoff } from "../../lib/refreshTokenGuard";
import {
  buildRefreshPayload,
  createAuthClient,
  refreshSessionTokens,
} from "../auth/authSession";

const API = import.meta.env.VITE_API_URL;
const DEFAULT_TIMEOUT_MS = 30000;
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

const postApi = createAuthClient({
  baseURL: `${API}/api/v1/post`,
  timeout: REQUEST_TIMEOUT_MS,
});
const likesApi = createAuthClient({
  baseURL: `${API}/api/v1/likes`,
  timeout: REQUEST_TIMEOUT_MS,
});
const commentApi = createAuthClient({
  baseURL: `${API}/api/v1/comments`,
  timeout: REQUEST_TIMEOUT_MS,
});
const refreshApi = createAuthClient({
  baseURL: `${API}/api/v1/users`,
  timeout: REQUEST_TIMEOUT_MS,
});

const normalizeError = (error) => ({
  code: error?.code || null,
  statusCode: error?.response?.status || null,
  message: error?.response?.data?.message || error?.message || "Request failed",
  data: error?.response?.data || null,
});

const refreshAccessToken = async () => {
  await runRefreshWithBackoff(() =>
    refreshSessionTokens(() => refreshApi.post("/refresh-token", buildRefreshPayload()))
  );
};

// Shared interceptor:
// 1) If protected request fails with 401, try refresh once.
// 2) Retry original request once.
// 3) Return normalized API error so UI can show backend message.
const attachAuthRetry = (client, { unwrapData = true } = {}) => {
  client.interceptors.response.use(
    (response) => (unwrapData ? response.data : response),
    async (error) => {
      const originalRequest = error?.config;
      if (!originalRequest) return Promise.reject(normalizeError(error));

      const isRefreshCall =
        originalRequest.url?.includes("/refresh-token") ||
        originalRequest.url?.includes("/refreshToken");

      if (isRefreshCall) {
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

attachAuthRetry(postApi);
attachAuthRetry(likesApi);
attachAuthRetry(commentApi, { unwrapData: false });

export const postService = {
  createPost: (postData) => postApi.post("/create-post", postData),
  getAllPosts: (params = {}) => postApi.get("/getAll-post", { params }),
  getPostById: (postId) => postApi.get(`/get-post/${postId}`),
  updatePost: (postId, postData) => postApi.put(`/update-post/${postId}`, postData),
  deletePost: (postId) => postApi.delete(`/delete-post/${postId}`),
  searchPosts: (query) => postApi.get("/search-post", { params: { q: query } }),
};

export const likeService = {
  togglePostLike: (postId) => likesApi.patch(`/posts/${postId}/like`),
  toggleCommentLike: (commentId) => likesApi.patch(`/comments/${commentId}/like`),
  getLikedPosts: () => likesApi.get("/liked-posts"),
};

export const commentService = {
  async getPostComments(postId, params = {}) {
    const response = await commentApi.get(`/posts/${postId}/comments`, { params });
    return {
      ...response.data,
      __pagination: {
        page: Number(response.headers?.["x-page"] || params.page || 1),
        limit: Number(response.headers?.["x-limit"] || params.limit || 10),
        totalCount: Number(response.headers?.["x-total-count"] || 0),
        totalPages: Number(response.headers?.["x-total-pages"] || 0),
      },
    };
  },
  createComment: (postId, content) =>
    commentApi.post(`/posts/${postId}/comments`, { content }),
  updateComment: (commentId, content) =>
    commentApi.patch(`/${commentId}`, { content }),
  deleteComment: (commentId) =>
    commentApi.delete(`/${commentId}`),
};

export default postApi;
