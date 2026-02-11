import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllPosts} from "../features/post/postThunks";
import {
  selectAllPosts,
  selectPostLoading,
  selectPostError,
} from "../features/post/postSlice";
import { Contaner, PostCard } from "../components";

function PostsList() {
  const dispatch = useDispatch();

  const posts = useSelector(selectAllPosts);
  const loading = useSelector(selectPostLoading);
  const error = useSelector(selectPostError);

  const handleFetchPosts = useCallback(() => {
    dispatch(getAllPosts());
  }, [dispatch]);

// Retry fetching posts after error

  const handleRetry = useCallback(() => {
    handleFetchPosts();
  }, [handleFetchPosts]);

 // LIFECYCLE - FETCH POSTS ON MOUNT
  useEffect(() => {
    handleFetchPosts();
  }, [handleFetchPosts]);

 

  // STATE 1: LOADING 
  if (loading) {
    return (
      <div className="w-full py-36 flex items-center justify-center min-h-screen">
        <div className="text-center">
          {/* Animated Spinner */}
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500"></div>
          </div>

          {/* Loading Message */}
          <h1 className="text-lg font-semibold text-gray-700">
            Loading posts...
          </h1>
          <p className="text-gray-500 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

 
  if (error) {
    return (
      <div className="w-full py-12 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          {/* Error Container */}
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 shadow-sm">
            {/* Error Icon */}
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              {/* Error Content */}
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Failed to load posts
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>

                {/* Retry Button */}
                <div className="mt-4">
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="Retry loading posts"
                  >
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY 
  if (!posts || posts.length === 0) {
    return (
      <div className="w-full py-36 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md text-center">
          {/* Empty State Icon */}
          <div className="flex justify-center mb-4">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          {/* Empty State Text */}
          <p className="text-gray-700 text-lg font-semibold">
            No posts found
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Check back later for new content
          </p>

          {/* Create Post Button */}
          <div className="mt-6">
            <a
              href="/create-post"
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition duration-200"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create First Post
            </a>
          </div>
        </div>
      </div>
    );
  }

  // SUCCESS - DISPLAY POSTS

  return (
    <div className="w-full py-30 bg-gray-50">
      <Contaner>
        {/* Posts Count */}
        <div className="mb-6">
          <p className="text-gray-600 text-sm">
            Showing {posts.length} post{posts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.map((post) => (
            <div
              key={post._id}
              className="h-full"
            >
              <PostCard post={post} />
            </div>
          ))}
        </div>
      </Contaner>
    </div>
  );
}

export default PostsList;