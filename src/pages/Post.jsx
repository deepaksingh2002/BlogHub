import React, { useEffect, useCallback, useState } from "react";
import parse from "html-react-parser";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getPostById,
  deletePost,
  togglePostLike,
  getPostComments,
  createComment,
  updateComment,
  deleteComment as deleteCommentThunk,
  toggleCommentLike,
} from "../features/post/postThunks";
import {
  selectPostById,
  selectPostLoading,
  selectPostError,
} from "../features/post/postSlice";
import {
  selectAuthUser,
  selectIsAuthenticated,
} from "../features/auth/authSlice";
import { Contaner } from "../components";

const getUserId = (user) =>
  user?._id || user?.id || user?.userId || null;

const getUserName = (user, fallback = "Unknown User") =>
  user?.username || user?.fullName || user?.name || fallback;

function Post() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { postId } = useParams();

  const post = useSelector((state) => selectPostById(state, postId));
  const loading = useSelector(selectPostLoading);
  const error = useSelector(selectPostError);
  const currentUser = useSelector(selectAuthUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUserId = getUserId(currentUser);

  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [postRequestDone, setPostRequestDone] = useState(false);
  const [postRequestLoading, setPostRequestLoading] = useState(true);
  const [isLikeSubmitting, setIsLikeSubmitting] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const isOwner =
    isAuthenticated &&
    getUserId(post?.owner || post?.author) &&
    getUserId(post?.owner || post?.author) === currentUserId;

  const likesCount =
    post?.likesCount ??
    (Array.isArray(post?.likes) ? post.likes.length : Number(post?.likes) || 0);
  const isLiked = Boolean(
    post?.isLiked ??
      post?.liked ??
      post?.likedByCurrentUser ??
      (Array.isArray(post?.likes) && currentUserId
        ? post.likes.some((like) => {
            const likeId =
              typeof like === "string"
                ? like
                : like?._id || like?.id || like?.userId || like?.owner?._id;
            return likeId === currentUserId;
          })
        : false)
  );

  const formatDate = (date) => {
    if (!date) return "";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

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
        getUserName(comment?.owner || comment?.author, "") ||
        comment?.authorName ||
        "Unknown User",
      createdAt: comment?.createdAt || comment?.created_at || new Date().toISOString(),
      likes:
        comment?.likesCount ??
        (Array.isArray(comment?.likes) ? comment.likes.length : Number(comment?.likes) || 0),
      liked: Boolean(comment?.isLiked ?? comment?.liked ?? false),
    }));
  };

  const fetchPost = useCallback(async () => {
    if (!postId) {
      navigate("/");
      return;
    }
    await dispatch(getPostById(postId)).unwrap();
  }, [postId, dispatch, navigate]);

  const loadComments = useCallback(async () => {
    if (!postId) return;
    try {
      const response = await dispatch(getPostComments(postId)).unwrap();
      setComments(normalizeComments(response));
    } catch {
      // Keep last known comments to avoid empty flicker on transient API failures.
    }
  }, [dispatch, postId]);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setPostRequestLoading(true);
      setPostRequestDone(false);
      try {
        await fetchPost();
      } catch {
        // handled by slice error
      }
      await loadComments();
      if (!active) return;
      setPostRequestLoading(false);
      setPostRequestDone(true);
    };

    loadData();

    return () => {
      active = false;
    };
  }, [fetchPost, loadComments]);

  const handleDelete = async () => {
    if (!post?._id || !isOwner) return;
    if (!window.confirm("Delete this post permanently?")) return;
    try {
      await dispatch(deletePost(post._id)).unwrap();
      navigate("/all-post");
    } catch (err) {
      alert(err?.message || "Delete failed");
    }
  };

  const handleEdit = () => {
    if (!post?._id) return;
    navigate(`/edit-post/${post._id}`);
  };

  const handleLike = async () => {
    if (!post?._id) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setActionError("");
    setIsLikeSubmitting(true);
    try {
      await dispatch(togglePostLike(post._id)).unwrap();
      await dispatch(getPostById(post._id)).unwrap();
    } catch {
      setActionError("Could not update like right now. Please try again.");
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
    setIsCommentSubmitting(true);
    try {
      await dispatch(createComment({ postId: post?._id || postId, content })).unwrap();
      setCommentText("");
      await loadComments();
    } catch {
      setActionError("Could not post comment right now. Please try again.");
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      await dispatch(toggleCommentLike(commentId)).unwrap();
      await loadComments();
    } catch {
      setActionError("Could not update comment like right now.");
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
      await dispatch(updateComment({ commentId, content })).unwrap();
      cancelEditComment();
      await loadComments();
    } catch {
      alert("Failed to update comment.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await dispatch(deleteCommentThunk(commentId)).unwrap();
      await loadComments();
    } catch {
      alert("Failed to delete comment.");
    }
  };

  if ((postRequestLoading || loading) && !post) {
    return (
      <main className="min-h-screen pt-32 pb-16 bg-gray-50 dark:bg-slate-900">
        <Contaner>
          <div className="max-w-3xl mx-auto text-center space-y-12 py-20">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100">Loading post...</h1>
          </div>
        </Contaner>
      </main>
    );
  }

  if ((postRequestDone && !post) || (error && !post && !postRequestLoading)) {
    return (
      <main className="min-h-screen pt-32 pb-16 bg-gray-50 dark:bg-slate-900">
        <Contaner>
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
        </Contaner>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-16 bg-gray-50 dark:bg-slate-900">
      <Contaner>
        <article className="max-w-4xl mx-auto">
          <nav className="text-sm text-gray-500 mb-8 flex items-center gap-2 dark:text-slate-400">
            <Link to="/all-post" className="hover:text-primary transition-colors">Posts</Link>
            <span>{'->'}</span>
            <span className="font-medium text-gray-900 dark:text-slate-100">{post.title}</span>
          </nav>

          <div className="mb-8">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
              {post.category || "Uncategorized"}
            </span>
          </div>

          <header className="mb-12">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-slate-100 mb-6 leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-slate-400">
              <span>{formatDate(post.createdAt)}</span>
              {post.views && <span>{'•'} {post.views} views</span>}
              {(post.owner || post.author) && (
                <span className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-300 rounded-full dark:bg-slate-600"></div>
                  {getUserName(post.owner || post.author)}
                </span>
              )}
            </div>
          </header>

          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleLike}
              disabled={isLikeSubmitting}
              className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                isLiked
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
              }`}
              type="button"
            >
              <svg className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{isLikeSubmitting ? "Updating..." : `${likesCount} Like${likesCount === 1 ? "" : "s"}`}</span>
            </button>

            {isOwner && (
              <div className="flex gap-3">
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-primary/90 hover:bg-primary text-white rounded-xl text-sm font-semibold shadow hover:shadow-md transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold shadow hover:shadow-md transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 lg:p-12 mb-12 prose prose-lg max-w-none dark:bg-slate-800 dark:border-slate-700 dark:prose-invert">
            {parse(post.content || "<p>No content available</p>")}
          </div>

          <section className="mt-14 mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              Comments
            </h2>

            {actionError && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                {actionError}
              </div>
            )}

            <form
              onSubmit={handleSubmitComment}
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 md:p-5 shadow-sm mb-6"
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
                <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center text-gray-600 dark:text-slate-300">
                  No comments yet. Be the first to comment.
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                          {comment.author}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          {formatDate(comment.createdAt)}
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
      </Contaner>
    </main>
  );
}

export default React.memo(Post);
