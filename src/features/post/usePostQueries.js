import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commentService, likeService, postService } from "./postApi";

const normalizeBooleanFlag = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n", ""].includes(normalized)) return false;
  }
  return undefined;
};

const normalizePostCategory = (post) => {
  if (!post || typeof post !== "object") return post;

  const resolvedCategory =
    post.category ??
    post.catagry ??
    post.catagory ??
    post.categoryName ??
    post.postCategory ??
    post.topic;

  if (!resolvedCategory) return post;

  return {
    ...post,
    category: resolvedCategory,
  };
};

const extractPostList = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.data?.posts)
        ? payload.data.posts
        : Array.isArray(payload?.posts)
          ? payload.posts
          : [];

  return Array.isArray(list) ? list.map(normalizePostCategory) : [];
};

const extractSinglePost = (payload) =>
  normalizePostCategory(
    payload?.data?.post || payload?.post || payload?.data || payload || null
  );

const extractComments = (payload) => {
  const base = payload?.data ?? payload;
  return Array.isArray(base)
    ? base
    : Array.isArray(base?.comments)
      ? base.comments
      : Array.isArray(base?.data)
        ? base.data
        : Array.isArray(base?.data?.comments)
          ? base.data.comments
          : [];
};

const queryKeys = {
  posts: ["posts"],
  postById: (postId) => ["post", postId],
  search: (query) => ["posts", "search", query],
  comments: (postId) => ["postComments", postId],
};

export const usePostsQuery = (params = {}, options = {}) => {
  return useQuery({
    queryKey: [...queryKeys.posts, params],
    queryFn: async () => {
      const response = await postService.getAllPosts(params);
      return extractPostList(response);
    },
    ...options,
  });
};

export const useSearchPostsQuery = (query, options = {}) => {
  const trimmedQuery = (query || "").trim();

  return useQuery({
    queryKey: queryKeys.search(trimmedQuery),
    enabled: Boolean(trimmedQuery) && (options.enabled ?? true),
    queryFn: async () => {
      const response = await postService.searchPosts(trimmedQuery);
      return extractPostList(response);
    },
    ...options,
  });
};

export const usePostQuery = (postId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.postById(postId),
    enabled: Boolean(postId) && (options.enabled ?? true),
    queryFn: async () => {
      const response = await postService.getPostById(postId);
      return extractSinglePost(response);
    },
    ...options,
  });
};

export const usePostCommentsQuery = (postId, params = {}, options = {}) => {
  return useQuery({
    queryKey: [...queryKeys.comments(postId), params],
    enabled: Boolean(postId) && (options.enabled ?? true),
    queryFn: async () => {
      const response = await commentService.getPostComments(postId, params);
      return extractComments(response);
    },
    ...options,
  });
};

export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const response = await postService.createPost(formData);
      return extractSinglePost(response);
    },
    onSuccess: async (post) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.posts });
      if (post?._id) {
        queryClient.setQueryData(queryKeys.postById(post._id), post);
      }
    },
  });
};

export const useUpdatePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, formData }) => {
      const response = await postService.updatePost(postId, formData);
      return extractSinglePost(response);
    },
    onSuccess: async (post) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.posts });
      if (post?._id) {
        queryClient.setQueryData(queryKeys.postById(post._id), post);
      }
    },
  });
};

export const useDeletePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId) => {
      await postService.deletePost(postId);
      return postId;
    },
    onSuccess: async (postId) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.posts });
      queryClient.removeQueries({ queryKey: queryKeys.postById(postId) });
      await queryClient.invalidateQueries({ queryKey: ["postComments", postId] });
    },
  });
};

export const useTogglePostLikeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId) => {
      const response = await likeService.togglePostLike(postId);
      const likedRaw =
        response?.data?.liked ??
        response?.liked ??
        response?.data?.isLiked ??
        response?.isLiked;
      const liked = normalizeBooleanFlag(likedRaw);
      const likesCountRaw =
        response?.data?.likesCount ??
        response?.likesCount ??
        response?.data?.likeCount ??
        response?.likeCount;
      const likesCount = Number.isFinite(Number(likesCountRaw))
        ? Number(likesCountRaw)
        : undefined;

      return { postId, liked, likesCount };
    },
    onSuccess: async ({ postId, liked, likesCount }) => {
      queryClient.setQueryData(queryKeys.postById(postId), (previous) => {
        if (!previous || typeof previous !== "object") return previous;

        const next = { ...previous };
        if (typeof liked === "boolean") {
          next.isLiked = liked;
          next.liked = liked;
        }
        if (typeof likesCount === "number") {
          next.likesCount = likesCount;
        }
        return next;
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.posts });
      await queryClient.invalidateQueries({ queryKey: ["posts", "search"] });
    },
  });
};

export const useCreateCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }) => {
      return commentService.createComment(postId, content);
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.comments(variables.postId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.postById(variables.postId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
};

export const useUpdateCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, content }) => {
      return commentService.updateComment(commentId, content);
    },
    onSuccess: async (_data, variables) => {
      if (variables?.postId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.comments(variables.postId) });
      }
    },
  });
};

export const useDeleteCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId }) => {
      await commentService.deleteComment(commentId);
      return { commentId };
    },
    onSuccess: async (_data, variables) => {
      if (variables?.postId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.comments(variables.postId) });
        await queryClient.invalidateQueries({ queryKey: queryKeys.postById(variables.postId) });
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
};

export const useToggleCommentLikeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }) => {
      const response = await likeService.toggleCommentLike(commentId);
      return { response, postId, commentId };
    },
    onSuccess: async (data) => {
      const { postId } = data;
      if (postId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.comments(postId) });
        await queryClient.invalidateQueries({ queryKey: queryKeys.postById(postId) });
      }
    },
  });
};

export const useReportPostMutation = () => {
  return useMutation({
    mutationFn: async ({ postId, reason }) => {
      return postService.reportPost(postId, reason);
    },
  });
};

export const useReportCommentMutation = () => {
  return useMutation({
    mutationFn: async ({ commentId, reason }) => {
      return commentService.reportComment(commentId, reason);
    },
  });
};
