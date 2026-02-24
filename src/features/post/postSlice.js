import { createSlice, createSelector, createEntityAdapter } from "@reduxjs/toolkit";
import {
  getAllPosts,
  getMyPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  searchPosts,
  togglePostLike,
  getLikedPosts,
} from "./postThunks";

const postAdapter = createEntityAdapter({
  selectId: (post) => post._id,
});

const initialState = postAdapter.getInitialState({
  loading: false,
  error: null,
  message: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
});

const extractLikeState = (payload = {}) => {
  const base = payload?.data || payload;
  const postLike = base?.post || base?.likedPost || base;

  const postId =
    postLike?.postId ||
    postLike?._id ||
    base?.postId ||
    null;

  const likesCountRaw =
    postLike?.likesCount ??
    postLike?.likeCount ??
    base?.likesCount ??
    (Array.isArray(postLike?.likes) ? postLike.likes.length : postLike?.likes);

  const likedRaw =
    postLike?.isLiked ??
    postLike?.liked ??
    postLike?.hasLiked ??
    postLike?.likedByCurrentUser ??
    base?.isLiked ??
    base?.liked;

  return {
    postId,
    likesCount: Number.isFinite(likesCountRaw) ? likesCountRaw : undefined,
    isLiked: typeof likedRaw === "boolean" ? likedRaw : undefined,
  };
};

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    clearPostMessage: (state) => {
      state.error = null;
      state.message = null;
    },
    clearSinglePost: (state) => {
      postAdapter.removeAll(state);
    },
    clearAllPosts: (state) => {
      postAdapter.removeAll(state);
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllPosts.fulfilled, (state, action) => {
        state.loading = false;
        postAdapter.setAll(state, action.payload.data || action.payload);
      })
      .addCase(getAllPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch posts";
      })
      .addCase(getPostById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPostById.fulfilled, (state, action) => {
        state.loading = false;
        postAdapter.upsertOne(state, action.payload);
      })
      .addCase(getPostById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch post";
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading = false;
        const newPost = action.payload.data || action.payload;
        postAdapter.addOne(state, newPost);
        state.message = "Post created successfully";
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.loading = false;
        const updatedPost = action.payload.data || action.payload;
        postAdapter.updateOne(state, { id: updatedPost._id, changes: updatedPost });
        state.message = "Post updated successfully";
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.loading = false;
        postAdapter.removeOne(state, action.payload);
        state.message = "Post deleted successfully";
      })
      .addCase(togglePostLike.fulfilled, (state, action) => {
        const fallbackPostId = action.meta.arg;
        const { postId, likesCount, isLiked } = extractLikeState(action.payload);
        const targetPostId = postId || fallbackPostId;

        if (!targetPostId || !state.entities[targetPostId]) return;

        const changes = {};
        if (typeof likesCount === "number") changes.likesCount = likesCount;
        if (typeof isLiked === "boolean") changes.isLiked = isLiked;

        if (Object.keys(changes).length > 0) {
          postAdapter.updateOne(state, {
            id: targetPostId,
            changes,
          });
        }
      })
      .addCase(getLikedPosts.fulfilled, (state, action) => {
        const payload = action.payload?.data || action.payload || [];
        const likedPosts = Array.isArray(payload) ? payload : payload?.posts || [];
        likedPosts.forEach((post) => {
          if (!post?._id) return;
          postAdapter.upsertOne(state, {
            ...post,
            isLiked: true,
          });
        });
      });
  },
});

export const { clearPostMessage, clearSinglePost, clearAllPosts } = postSlice.actions;
export default postSlice.reducer;

export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectTotal: selectPostCount,
} = postAdapter.getSelectors((state) => state.post);

export const selectPostLoading = createSelector(
  [(state) => state.post.loading],
  (loading) => loading
);

export const selectPostError = createSelector(
  [(state) => state.post.error],
  (error) => error
);


export const selectSinglePost = createSelector(
  [(state, postId) => postId, (state) => state.post.entities],
  (postId, entities) => entities[postId] || null
);
