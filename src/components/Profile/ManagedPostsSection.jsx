import React from "react";
import { Link } from "react-router-dom";

function ManagedPostsSection({ posts = [], onDeletePost }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="text-xl sm:text-2xl font-black text-dark dark:text-light">My Posts</h2>
        <Link
          to="/add-post"
          className="h-10 px-4 inline-flex items-center rounded-xl bg-primary text-light text-sm font-semibold hover:opacity-90"
        >
          New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-beige bg-light py-10 px-5 text-center dark:border-light/20 dark:bg-background">
          <p className="text-dark font-semibold dark:text-light">You have not created any posts yet.</p>
          <p className="text-dark/70 text-sm mt-1 dark:text-light/80">Start sharing your story now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {posts.map((post) => (
            <div key={post._id} className="rounded-2xl border border-beige overflow-hidden bg-background dark:bg-background dark:border-light/20 shadow-sm hover:shadow-md transition-shadow">
              <img
                src={post.thumbnail || "https://via.placeholder.com/600x400?text=No+Image"}
                alt={post.title}
                className="w-full h-44 object-cover"
              />
              <div className="p-4 space-y-2.5">
                <h3 className="font-bold text-dark line-clamp-2 dark:text-light">{post.title}</h3>
                <p className="text-xs text-dark/70 dark:text-light/80">Views: {post.views || 0}</p>
                <div className="flex gap-2 pt-2">
                  <Link
                    to={`/post/${post._id}`}
                    className="flex-1 text-center rounded-lg border border-beige px-3 py-2 text-sm font-semibold text-dark hover:bg-light dark:border-light/20 dark:text-light dark:hover:bg-background"
                  >
                    View
                  </Link>
                  <Link
                    to={`/edit-post/${post._id}`}
                    className="flex-1 text-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-light hover:opacity-90"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => onDeletePost(post._id)}
                    className="rounded-lg bg-warning px-3 py-2 text-sm font-semibold text-light hover:bg-warning/90"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default React.memo(ManagedPostsSection);