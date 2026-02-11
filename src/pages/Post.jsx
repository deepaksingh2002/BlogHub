import React, { useEffect, useCallback } from "react";
import parse from "html-react-parser";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { 
  getPostById, 
  deletePost 
} from "../features/post/postThunks";
import { 
  selectPostById,
  selectPostLoading,
  selectPostError 
} from "../features/post/postSlice";
import { 
  selectAuthUser, 
  selectIsAuthenticated 
} from "../features/auth/authSlice";
import { Contaner } from "../components";

function Post() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { postId } = useParams();

  const post = useSelector((state) => selectPostById(state, postId));
  const loading = useSelector(selectPostLoading);
  const error = useSelector(selectPostError);
  const currentUser = useSelector(selectAuthUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const isOwner = isAuthenticated && 
                  post?.owner?._id && 
                  post.owner._id === currentUser?._id;

  const fetchPost = useCallback(() => {
    if (!postId) {
      navigate("/");
      return;
    }
    dispatch(getPostById(postId));
  }, [postId, dispatch, navigate]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

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

  if (loading) {
    return (
      <main className="min-h-screen pt-32 pb-16 bg-gray-50">
        <Contaner>
          <div className="max-w-3xl mx-auto text-center space-y-12 py-20">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Loading post...</h1>
          </div>
        </Contaner>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="min-h-screen pt-32 pb-16 bg-gray-50">
        <Contaner>
          <div className="max-w-2xl mx-auto text-center py-20 space-y-8">
            <div className="w-24 h-24 mx-auto bg-red-50 border-4 border-red-100 rounded-2xl flex items-center justify-center">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-gray-900">Post Not Found</h1>
              <p className="text-lg text-gray-600 max-w-md mx-auto">This post doesn't exist or has been removed.</p>
            </div>
            <Link to="/all-post" className="inline-block">
              <button className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
                ← Back to Posts
              </button>
            </Link>
          </div>
        </Contaner>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-16 bg-gray-50">
      <Contaner>
        <article className="max-w-4xl mx-auto">
          
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-8 flex items-center gap-2">
            <Link to="/all-post" className="hover:text-primary transition-colors">Posts</Link>
            <span>→</span>
            <span className="font-medium text-gray-900">{post.title}</span>
          </nav>

          {/* Category Badge */}
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
              {post.category || 'Uncategorized'}
            </span>
          </div>

          {/* Title & Meta */}
          <header className="mb-12">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <span>{formatDate(post.createdAt)}</span>
              {post.views && <span>• {post.views} views</span>}
              {post.owner && (
                <span className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                  {post.owner.username}
                </span>
              )}
            </div>
          </header>

          {/* Owner Actions - Top Right (Screenshot Style) */}
          {isOwner && (
            <div className="flex gap-3 mb-8 absolute top-4 right-4 lg:static lg:mb-8">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 bg-primary/90 hover:bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium shadow hover:shadow-md transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow hover:shadow-md transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          )}

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 lg:p-12 mb-12 prose prose-lg max-w-none">
            {parse(post.content || "<p>No content available</p>")}
          </div>

          {/* Back Button */}
          <div className="text-center">
            <Link to="/all-post" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 rounded-xl shadow hover:shadow-lg transition-all duration-200">
              ← Back to All Posts
            </Link>
          </div>
        </article>
      </Contaner>
    </main>
  );
}

export default React.memo(Post);
