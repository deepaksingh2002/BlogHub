import { createAsyncThunk } from "@reduxjs/toolkit";
import { commentService, likeService, postService } from "./postApi";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientPostFetchError = (error) => {
  const code = error?.code;
  const statusCode = error?.statusCode || error?.response?.status;
  return (
    code === "ECONNABORTED" ||
    code === "ETIMEDOUT" ||
    code === "ERR_NETWORK" ||
    statusCode === 408 ||
    statusCode === 429 ||
    (typeof statusCode === "number" && statusCode >= 500)
  );
};

const getPostFetchErrorMessage = (error) => {
  if (!error) return "Failed to fetch posts";
  if (error?.statusCode === 503) return "Server is temporarily unavailable. Please try again.";
  if (error?.code === "ECONNABORTED" || /timeout/i.test(error?.message || "")) {
    return "The request took too long. Please check your connection and retry.";
  }
  return error?.message || "Failed to fetch posts";
};

export const getAllPosts = createAsyncThunk(
  "posts/getAllPosts",
  async (params = {}, { rejectWithValue }) => {
    const maxAttempts = 2;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await postService.getAllPosts(params);
        return response;
      } catch (error) {
        lastError = error;
        if (!isTransientPostFetchError(error) || attempt === maxAttempts) {
          break;
        }
        await wait(600 * attempt);
      }
    }

    return rejectWithValue(getPostFetchErrorMessage(lastError));
  }
);

export const getMyPosts = createAsyncThunk(
  "post/getMyPosts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await postService.getAllPosts();
      return res.data || res;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getPostById = createAsyncThunk(
  "posts/getPostById",
  async (postId, { rejectWithValue }) => {
    try {
      const response = await postService.getPostById(postId);
      return (
        response?.data?.post ||
        response?.post ||
        response?.data ||
        response
      );
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch post");
    }
  }
);

export const searchPosts = createAsyncThunk(
  "posts/searchPosts",
  async (query, { rejectWithValue }) => {
    try {
      const response = await postService.searchPosts(query);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to search posts");
    }
  }
);

export const createPost = createAsyncThunk(
  "post/create",
  async (formData, { rejectWithValue }) => {
    try {
      return await postService.createPost(formData);
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const updatePost = createAsyncThunk(
  "post/update",
  async ({ postId, formData }, { rejectWithValue }) => {
    try {
      return await postService.updatePost(postId, formData);
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const deletePost = createAsyncThunk(
  "post/delete",
  async (postId, { rejectWithValue }) => {
    try {
      await postService.deletePost(postId);
      return postId;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const togglePostLike = createAsyncThunk(
  "post/toggleLike",
  async (postId, { rejectWithValue }) => {
    try {
      const response = await likeService.togglePostLike(postId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to toggle like");
    }
  }
);

export const getLikedPosts = createAsyncThunk(
  "post/getLikedPosts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await likeService.getLikedPosts();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch liked posts");
    }
  }
);

export const getPostComments = createAsyncThunk(
  "comment/getPostComments",
  async (arg, { rejectWithValue }) => {
    try {
      const postId = typeof arg === "string" ? arg : arg?.postId;
      const params = typeof arg === "object" ? { page: arg?.page, limit: arg?.limit } : {};
      const response = await commentService.getPostComments(postId, params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch comments");
    }
  }
);

export const createComment = createAsyncThunk(
  "comment/createComment",
  async ({ postId, content }, { rejectWithValue }) => {
    try {
      const response = await commentService.createComment(postId, content);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create comment");
    }
  }
);

export const updateComment = createAsyncThunk(
  "comment/updateComment",
  async ({ commentId, content }, { rejectWithValue }) => {
    try {
      const response = await commentService.updateComment(commentId, content);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update comment");
    }
  }
);

export const deleteComment = createAsyncThunk(
  "comment/deleteComment",
  async (commentId, { rejectWithValue }) => {
    try {
      await commentService.deleteComment(commentId);
      return commentId;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete comment");
    }
  }
);

export const toggleCommentLike = createAsyncThunk(
  "comment/toggleLike",
  async (commentId, { rejectWithValue }) => {
    try {
      const response = await likeService.toggleCommentLike(commentId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to toggle comment like");
    }
  }
);
