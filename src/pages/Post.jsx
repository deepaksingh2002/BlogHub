import React, { useEffect, useCallback } from "react";
import parse from "html-react-parser";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPostById, deletePost } from "../features/post/postThunks";
import { 
  selectPostById,
  selectPostLoading,
  selectPostError 
} from "../features/post/postSlice";
import { selectAuthUser, selectIsAuthenticated } from "../features/auth/authSlice";
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

  // Optimized: useCallback prevents recreation
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
      console.error("Delete failed:", err);
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
      <article className="py-8 bg-gray-50 min-h-screen">
        <Contaner>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2">Loading post...</p>
          </div>
        </Contaner>
      </article>
    );
  }

  if (error || !post) {
    return (
      <article className="py-8 bg-gray-50 min-h-screen">
        <Contaner>
          <div className="text-center py-8 text-red-500">
            {error || "Post not found"}
          </div>
          <Link to="/all-post" className="block text-center mt-4">
            <button className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition">
              Back to Posts
            </button>
          </Link>
        </Contaner>
      </article>
    );
  }

  return (
    <article className="py-8 bg-gray-50 min-h-screen">
      <Contaner>
        {/* Hero Image */}
        <div className="relative w-full h-[50vh] rounded-2xl overflow-hidden shadow-lg mb-8 bg-gray-200">
          {post.thumbnail ? (
            <img 
              src={post.thumbnail} 
              alt={post.title}
              className="w-full h-full object-cover"
              loading="eager" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <span className="text-gray-500 text-lg">No Image</span>
            </div>
          )}

          {/* Owner Actions - SAFE */}
          {isOwner && (
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                onClick={handleEdit}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                title="Edit post"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                title="Delete post"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
              <span>Category: {post.category || post.catagry || 'Uncategorized'}</span>
              <span>•</span>
              <span>Published: {formatDate(post.createdAt)}</span>
              {post.views && (
                <>
                  <span>•</span>
                  <span>Views: {post.views}</span>
                </>
              )}
            </div>

            {post.owner && (
              <div className="flex items-center gap-3 text-sm text-gray-600 mb-6">
                <img 
                  src={post.owner.avatar} 
                  alt={post.owner.username}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div>
                  <p className="font-semibold text-gray-900">{post.owner.username}</p>
                  <p className="text-gray-500">{formatDate(post.updatedAt || post.createdAt)}</p>
                </div>
              </div>
            )}
          </header>

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-8">
            {parse(post.content || "<p>No content available</p>")}
          </div>

          {/* Back Button */}
          <Link to="/all-post" className="inline-block">
            <button className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl">
              ← Back to All Posts
            </button>
          </Link>
        </div>
      </Contaner>
    </article>
  );
}

export default React.memo(Post);
