import React, { useCallback } from "react";
import { usePostsQuery } from "../features/post/usePostQueries";
import { Container, PostListCard } from "../components";

function PostsList() {
  const {
    data: posts = [],
    isLoading: loading,
    error,
    refetch,
  } = usePostsQuery();

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

 

  // STATE 1: LOADING 
  if (loading) {
    return (
      <div className="w-full py-36 flex items-center justify-center min-h-screen bg-background dark:bg-background">
        <div className="text-center">
          {/* Animated Spinner */}
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary/30 border-t-primary"></div>
          </div>

          {/* Loading Message */}
          <h1 className="text-lg font-semibold text-dark dark:text-dark">
            Loading posts...
          </h1>
          <p className="text-dark/60 text-sm mt-2 dark:text-dark/60">Please wait</p>
        </div>
      </div>
    );
  }

 
  if (error) {
    return (
      <div className="w-full py-12 flex items-center justify-center min-h-screen bg-background dark:bg-background">
        <div className="w-full max-w-md">
          {/* Error Container */}
          <div className="bg-warning/10 border-l-4 border-warning rounded-lg p-6 shadow-sm">
            {/* Error Icon */}
            <div className="flex items-start">
              <div className="shrink-0">
                <svg
                  className="h-6 w-6 text-warning"
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
                <h3 className="text-sm font-medium text-warning">
                  Failed to load posts
                </h3>
                <div className="mt-2 text-sm text-warning">
                  <p>{error?.message || "Failed to load posts"}</p>
                </div>

                {/* Retry Button */}
                <div className="mt-4">
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center px-4 py-2 bg-warning text-light font-medium rounded-lg hover:opacity-90 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-warning focus:ring-offset-2"
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
      <div className="w-full py-36 flex items-center justify-center min-h-screen bg-background dark:bg-background">
        <div className="w-full max-w-md text-center">
          {/* Empty State Icon */}
          <div className="flex justify-center mb-4">
            <svg
              className="w-16 h-16 text-secondary"
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
          <p className="text-dark text-lg font-semibold dark:text-dark">
            No posts found
          </p>
          <p className="text-dark/60 text-sm mt-2 dark:text-dark/60">
            Check back later for new content
          </p>

          {/* Create Post Button */}
          <div className="mt-6">
            <a
              href="/add-post"
              className="inline-flex items-center px-4 py-2 bg-primary text-light font-medium rounded-lg hover:opacity-90 transition duration-200"
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
    <div className="w-full pt-32 pb-20 bg-background dark:bg-background">
      <Container>
        <div className="max-w-6xl mx-auto">
          <div>
          {posts.map((post) => (
            <div
              key={post._id}
              className="h-full"
            >
              <PostListCard post={post} />
            </div>
          ))}
          </div>
        </div>
      </Container>
    </div>
  );
}

export default PostsList;
