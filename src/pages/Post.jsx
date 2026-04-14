import React, { useEffect, useCallback, useState } from "react";
import parse from "html-react-parser";
import { HiCheckBadge } from "react-icons/hi2";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  selectAuthUser,
  selectIsAuthenticated,
} from "../features/auth/authSlice";
import { Container } from "../components";
import {
  useCreateCommentMutation,
  useDeleteCommentMutation,
  usePostCommentsQuery,
  usePostQuery,
  useReportCommentMutation,
  useReportPostMutation,
  useToggleCommentLikeMutation,
  useTogglePostLikeMutation,
  useUpdateCommentMutation,
} from "../features/post/usePostQueries";
import {
  formatDisplayDate,
  getPostLikesCount,
  getPostOwner,
  getUserDisplayName,
  getUserId,
  isVerifiedAuthor,
  resolvePostCategory,
} from "../utils/postHelpers";

const toBooleanFlag = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n", ""].includes(normalized)) return false;
  }
  return undefined;
};

function Post() {
  const navigate = useNavigate();
  const { postId } = useParams();

  const {
    data: post,
    isLoading: postLoading,
    isFetched: postRequestDone,
    error,
  } = usePostQuery(postId);
  const { data: rawComments = [], refetch: refetchComments } = usePostCommentsQuery(postId);
  const togglePostLikeMutation = useTogglePostLikeMutation();
  const createCommentMutation = useCreateCommentMutation();
  const updateCommentMutation = useUpdateCommentMutation();
  const deleteCommentMutation = useDeleteCommentMutation();
  const toggleCommentLikeMutation = useToggleCommentLikeMutation();
  const reportPostMutation = useReportPostMutation();
  const reportCommentMutation = useReportCommentMutation();

  const currentUser = useSelector(selectAuthUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUserId = getUserId(currentUser);
  const postOwner = getPostOwner(post);
  const isPostOwnerVerified = isVerifiedAuthor(postOwner);

  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [isLikeSubmitting, setIsLikeSubmitting] = useState(false);
  const [likePulse, setLikePulse] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const likesCount = getPostLikesCount(post);
  const explicitLiked =
    toBooleanFlag(post?.isLiked) ??
    toBooleanFlag(post?.liked) ??
    toBooleanFlag(post?.likedByCurrentUser);
  const derivedLikedFromArray =
    Array.isArray(post?.likes) && currentUserId
      ? post.likes.some((like) => {
          const likeId =
            typeof like === "string"
              ? like
              : like?._id || like?.id || like?.userId || like?.owner?._id;
          return likeId === currentUserId;
        })
      : false;
  const isLiked = explicitLiked ?? derivedLikedFromArray;
  const plainTextContent = String(post?.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plainTextContent ? plainTextContent.split(" ").length : 0;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 220));

  // Converts backend comment shapes into one UI shape used by this page.
  const normalizeComments = (payload) => {
    const base = payload?.data ?? payload;
    const list = Array.isArray(base)
      ? base
      : Array.isArray(base?.comments)
        ? base.comments
        : Array.isArray(base?.data)
          ? base.data
          : Array.isArray(base?.data?.comments)
            ? base.data.comments
            : [];

    return list.map((comment, index) => ({
      id: comment?._id || comment?.id || `server-${index}`,
      content: comment?.content || comment?.text || "",
      authorId:
        comment?.owner?._id ||
        comment?.owner?.id ||
        comment?.author?._id ||
        comment?.author?.id ||
        comment?.userId ||
        null,
      author:
        getUserDisplayName(comment?.owner || comment?.author, "") ||
        comment?.authorName ||
        "Unknown User",
      createdAt: comment?.createdAt || comment?.created_at || new Date().toISOString(),
      likes:
        comment?.likesCount ??
        (Array.isArray(comment?.likes) ? comment.likes.length : Number(comment?.likes) || 0),
      liked: toBooleanFlag(comment?.isLiked) ?? toBooleanFlag(comment?.liked) ?? false,
    }));
  };

  // Normalize freshly created comment response so we can prepend without reload.
  const normalizeSingleComment = (payload) => {
    const base = payload?.data ?? payload;
    const candidate =
      base?.comment ||
      base?.data?.comment ||
      base?.data ||
      base;
    const [normalized] = normalizeComments({ data: [candidate] });
    return normalized;
  };

  const loadComments = useCallback(async () => {
    try {
      const result = await refetchComments();
      setComments(normalizeComments(result.data));
    } catch {
      // Keep last known comments to avoid empty flicker on transient API failures.
    }
  }, [refetchComments]);

  useEffect(() => {
    if (!postId) {
      navigate("/");
      return;
    }
    setComments(normalizeComments(rawComments));
  }, [postId, rawComments, navigate]);

  useEffect(() => {
    if (document.getElementById("post-like-animations")) return;

    const style = document.createElement("style");
    style.id = "post-like-animations";
    style.textContent = `
      @keyframes like-pop {
        0% { transform: scale(1); }
        40% { transform: scale(1.2) rotate(-4deg); }
        65% { transform: scale(0.96) rotate(2deg); }
        100% { transform: scale(1); }
      }
      @keyframes like-glow {
        0% { box-shadow: 0 0 0 0 rgba(242, 106, 27, 0.55); }
        70% { box-shadow: 0 0 0 14px rgba(242, 106, 27, 0); }
        100% { box-shadow: 0 0 0 0 rgba(242, 106, 27, 0); }
      }
      @keyframes like-float {
        0% { opacity: 0; transform: translateY(0) scale(0.6); }
        30% { opacity: 1; }
        100% { opacity: 0; transform: translateY(-18px) scale(1.1); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const handleLike = async () => {
    if (!post?._id) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setActionError("");
    setActionMessage("");
    setIsLikeSubmitting(true);
    try {
      await togglePostLikeMutation.mutateAsync(post._id);
      setLikePulse(true);
      window.setTimeout(() => setLikePulse(false), 560);
    } catch (err) {
      const message =
        typeof err === "string"
          ? err
          : err?.message || "Could not update like right now. Please try again.";
      setActionError(message);
    } finally {
      setIsLikeSubmitting(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const content = commentText.trim();
    if (!content) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setActionError("");
    setActionMessage("");
    setIsCommentSubmitting(true);
    try {
      const created = await createCommentMutation.mutateAsync({ postId: post?._id || postId, content });
      const normalized = normalizeSingleComment(created);
      if (normalized?.id) {
        setComments((prev) => [normalized, ...prev.filter((item) => item.id !== normalized.id)]);
      }
      setCommentText("");
    } catch (err) {
      const message =
        typeof err === "string"
          ? err
          : err?.message || "Could not post comment right now. Please try again.";
      setActionError(message);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Optimistic UI: update instantly, rollback if API call fails.
    const snapshot = comments;
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id !== commentId) return comment;
        const nextLiked = !comment.liked;
        return {
          ...comment,
          liked: nextLiked,
          likes: Math.max(0, Number(comment.likes || 0) + (nextLiked ? 1 : -1)),
        };
      })
    );

    try {
      await toggleCommentLikeMutation.mutateAsync({ commentId, postId: post?._id || postId });
    } catch (err) {
      setComments(snapshot);
      const message =
        typeof err === "string"
          ? err
          : err?.message || "Could not update comment like right now.";
      setActionError(message);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1600);
    } catch {
      setActionError("Could not copy link.");
    }
  };

  const handleReportPost = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setActionError("");
    setActionMessage("");
    try {
      const response = await reportPostMutation.mutateAsync({ postId: post?._id || postId, reason: "" });
      setActionMessage(response?.message || "Post reported successfully");
    } catch (err) {
      setActionError(err?.message || "Could not report post right now.");
    }
  };

  const handleReportComment = async (commentId) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setActionError("");
    setActionMessage("");
    try {
      const response = await reportCommentMutation.mutateAsync({ commentId, reason: "" });
      setActionMessage(response?.message || "Comment reported successfully");
    } catch (err) {
      setActionError(err?.message || "Could not report comment right now.");
    }
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.content || "");
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingText("");
  };

  const saveEditComment = async (commentId) => {
    const content = editingText.trim();
    if (!content) return;
    try {
      await updateCommentMutation.mutateAsync({ commentId, content, postId: post?._id || postId });
      cancelEditComment();
      await loadComments();
    } catch {
      alert("Failed to update comment.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteCommentMutation.mutateAsync({ commentId, postId: post?._id || postId });
      await loadComments();
    } catch {
      alert("Failed to delete comment.");
    }
  };

  if (postLoading && !post) {
    return (
      <main className="min-h-screen pt-32 pb-16 bg-gray-50 dark:bg-slate-900">
        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-12 py-20">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100">Loading post...</h1>
          </div>
        </Container>
      </main>
    );
  }

  if ((postRequestDone && !post) || (error && !post && !postLoading)) {
    return (
      <main className="min-h-screen pt-32 pb-16 bg-gray-50 dark:bg-slate-900">
        <Container>
          <div className="max-w-2xl mx-auto text-center py-20 space-y-8">
            <div className="w-24 h-24 mx-auto bg-red-50 border-4 border-red-100 rounded-2xl flex items-center justify-center dark:bg-red-950/30 dark:border-red-900">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100">Post Not Found</h1>
              <p className="text-lg text-gray-600 max-w-md mx-auto dark:text-slate-300">This post doesn't exist or has been removed.</p>
            </div>
            <Link to="/all-post" className="inline-block">
              <button className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
                {'<-'} Back to Posts
              </button>
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-16 bg-linear-to-b from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <Container>
        <article className="max-w-4xl mx-auto">
          <nav className="text-sm text-gray-500 mb-8 flex items-center gap-2 dark:text-slate-400">
            <Link to="/all-post" className="hover:text-primary transition-colors">Posts</Link>
            <span>{'->'}</span>
            <span className="font-medium text-gray-900 dark:text-slate-100 line-clamp-1">{post.title}</span>
          </nav>

          <section className="rounded-3xl border border-gray-200 bg-white p-7 md:p-10 lg:p-12 shadow-xl dark:border-slate-700 dark:bg-slate-800 mb-10">
            <header className="text-center mb-8">
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-5">
                {resolvePostCategory(post, "Uncategorized")}
              </span>
              <h1 className="font-serif text-3xl md:text-5xl font-bold text-gray-900 dark:text-slate-100 leading-tight">
                {post.title}
              </h1>
            </header>

            <div className="prose prose-lg prose-headings:font-extrabold prose-a:text-primary max-w-none dark:prose-invert">
              {parse(post.content || "<p>No content available</p>")}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700 dark:text-slate-200">
                <span className="inline-flex items-center h-9 rounded-full border border-gray-300 px-4 dark:border-slate-600">
                  {formatDisplayDate(post.createdAt)}
                </span>
                <span className="inline-flex items-center h-9 rounded-full border border-gray-300 px-4 dark:border-slate-600">
                  {post.views || 0} views
                </span>
                <span className="inline-flex items-center h-9 rounded-full border border-gray-300 px-4 dark:border-slate-600">
                  {comments.length} comments
                </span>
                <span className="inline-flex items-center h-9 rounded-full border border-gray-300 px-4 dark:border-slate-600">
                  {readTimeMinutes} min read
                </span>
                {Boolean(post?.owner || post?.author || post?.user) && (
                  <span className="inline-flex items-center gap-2 h-9 rounded-full border border-gray-300 px-4 dark:border-slate-600">
                    <div className="w-5 h-5 bg-gray-300 rounded-full dark:bg-slate-600"></div>
                    <span className="inline-flex items-center gap-1">
                      {getUserDisplayName(postOwner)}
                      {isPostOwnerVerified && (
                        <HiCheckBadge className="w-4 h-4 text-primary" title="Verified author" />
                      )}
                    </span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleLike}
                    disabled={isLikeSubmitting}
                    style={
                      likePulse
                        ? {
                            animation: "like-pop 560ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                            backgroundColor: isLiked ? "var(--color-primary)" : undefined,
                            borderColor: isLiked ? "var(--color-primary)" : undefined,
                            boxShadow: isLiked ? "0 12px 28px rgba(242, 106, 27, 0.28)" : undefined,
                          }
                        : isLiked
                          ? {
                              backgroundColor: "var(--color-primary)",
                              borderColor: "var(--color-primary)",
                              boxShadow: "0 10px 24px rgba(242, 106, 27, 0.22)",
                            }
                          : undefined
                    }
                    className={`relative inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden ${
                      isLiked
                        ? "text-white border border-transparent hover:brightness-95"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
                    }`}
                    type="button"
                  >
                    {likePulse && isLiked && (
                      <span className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.35),transparent_58%)] animate-[like-glow_560ms_ease-out]" />
                    )}
                    <svg
                      className={`relative z-10 w-4 h-4 transition-transform duration-300 ${
                        isLiked ? "scale-110 drop-shadow-sm" : ""
                      } ${likePulse ? "rotate-[-8deg] scale-125" : ""}`}
                      fill={isLiked ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="relative z-10">
                      {`${likesCount} Like${likesCount === 1 ? "" : "s"}`}
                    </span>
                    {likePulse && isLiked && (
                      <span className="pointer-events-none absolute -top-2 right-4 z-0 h-2 w-2 rounded-full bg-white/90 animate-[like-float_560ms_ease-out]" />
                    )}
                    {likePulse && isLiked && (
                      <span className="pointer-events-none absolute -bottom-1 left-5 z-0 h-1.5 w-1.5 rounded-full bg-white/80 animate-[like-float_560ms_ease-out_80ms]" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 8h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {copiedLink ? "Copied" : "Copy Link"}
                  </button>
                  <button
                    type="button"
                    onClick={handleReportPost}
                    disabled={reportPostMutation.isPending}
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
                  >
                    {reportPostMutation.isPending ? "Reporting..." : "Report Post"}
                  </button>
                </div>

              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 md:p-7 shadow-lg dark:border-slate-700 dark:bg-slate-800 mb-8">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              Comments ({comments.length})
            </h2>

            {actionError && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                {actionError}
              </div>
            )}
            {actionMessage && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                {actionMessage}
              </div>
            )}

            <form
              onSubmit={handleSubmitComment}
              className="border border-gray-200 dark:border-slate-700 rounded-2xl p-4 md:p-5 mb-6"
            >
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                Add a comment
              </label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                placeholder="Write your comment..."
                className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isCommentSubmitting}
                  className="inline-flex items-center justify-center h-11 px-5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isCommentSubmitting ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 p-6 text-center text-gray-600 dark:text-slate-300">
                  No comments yet. Be the first to comment.
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                          {comment.author}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          {formatDisplayDate(comment.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleCommentLike(comment.id)}
                        className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
                          comment.liked
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill={comment.liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{comment.likes}</span>
                      </button>
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="mt-3 space-y-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 px-3 py-2"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={cancelEditComment}
                            className="h-9 px-3 rounded-lg border border-gray-300 text-gray-700 dark:text-slate-200 dark:border-slate-600"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditComment(comment.id)}
                            className="h-9 px-3 rounded-lg bg-primary text-white"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-gray-700 dark:text-slate-300 leading-relaxed">
                        {comment.content}
                      </p>
                    )}

                    {isAuthenticated && currentUserId === comment.authorId && editingCommentId !== comment.id && (
                      <div className="mt-3 flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => startEditComment(comment)}
                          className="h-8 px-3 rounded-lg border border-gray-300 text-gray-700 text-xs dark:text-slate-200 dark:border-slate-600"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-8 px-3 rounded-lg bg-red-500 text-white text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    )}

                    {isAuthenticated && currentUserId !== comment.authorId && (
                      <div className="mt-3 flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => handleReportComment(comment.id)}
                          disabled={reportCommentMutation.isPending}
                          className="h-8 px-3 rounded-lg bg-amber-500 text-white text-xs disabled:opacity-60"
                        >
                          {reportCommentMutation.isPending ? "Reporting..." : "Report"}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <div className="text-center">
            <Link to="/all-post" className="inline-flex items-center gap-2 h-11 px-6 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow hover:shadow-lg transition-all duration-200">
              {'<-'} Back to All Posts
            </Link>
          </div>
        </article>
      </Container>
    </main>
  );
}

export default React.memo(Post);
