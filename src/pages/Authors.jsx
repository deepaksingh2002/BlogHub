import React from "react";
import { HiCheckBadge } from "react-icons/hi2";
import { useSelector } from "react-redux";
import { Container } from "../components";
import { selectAuthUser } from "../features/auth/authSlice";
import { useAuthorsListQuery, useToggleFollowMutation } from "../features/subscription/useSubscriptionQueries";
import { isVerifiedAuthor } from "../utils/postHelpers";

const getDisplayName = (author) =>
  author?.fullName || author?.username || "Unknown Author";

const getAvatarUrl = (author) =>
  author?.avatar?.url ||
  author?.avatar ||
  author?.profilePic?.url ||
  author?.profilePic ||
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

function Authors() {
  const currentUser = useSelector(selectAuthUser);
  const currentUserId = currentUser?._id || currentUser?.id || currentUser?.userId || null;

  const authorsQuery = useAuthorsListQuery(true);
  const followMutation = useToggleFollowMutation();

  const authors = authorsQuery.data || [];

  const handleToggleFollow = async (authorId) => {
    if (!authorId) return;
    try {
      await followMutation.mutateAsync(authorId);
    } catch {
      // handled by query state
    }
  };

  return (
    <div className="min-h-screen pt-28 md:pt-32 pb-16 bg-linear-to-b from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <Container>
        <section className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-slate-100">Authors</h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-slate-300">
              Discover creators and follow your favorite authors.
            </p>
          </div>

          {authorsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-36 rounded-2xl border border-gray-200 bg-white/80 animate-pulse dark:bg-slate-800 dark:border-slate-700" />
              ))}
            </div>
          ) : authorsQuery.error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
              {authorsQuery.error?.message || "Could not load authors right now."}
            </div>
          ) : authors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              No authors found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {authors.map((author) => {
                const authorId = author?._id || author?.id;
                const isSelf = currentUserId && String(currentUserId) === String(authorId);
                const isFollowing = Boolean(author?.isFollowing);
                const isAuthorVerified = isVerifiedAuthor(author);

                return (
                  <article
                    key={authorId}
                    className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm dark:bg-slate-800 dark:border-slate-700"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={getAvatarUrl(author)}
                        alt={getDisplayName(author)}
                        className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-slate-600"
                      />

                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 truncate inline-flex items-center gap-1.5">
                          <span className="truncate">{getDisplayName(author)}</span>
                          {isAuthorVerified && (
                            <HiCheckBadge className="h-4 w-4 shrink-0 text-primary" title="Verified author" />
                          )}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                          @{author?.username || "unknown"}
                        </p>
                        <p className="mt-2 text-sm text-gray-600 dark:text-slate-300 line-clamp-2">
                          {author?.bio?.trim() || "No bio available yet."}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                            {Number(author?.followerCount || 0)} followers
                          </span>

                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => handleToggleFollow(authorId)}
                              disabled={followMutation.isPending}
                              className={`h-9 px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${
                                isFollowing
                                  ? "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                                  : "bg-primary text-white hover:opacity-90"
                              }`}
                            >
                              {isFollowing ? "Unfollow" : "Follow"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </Container>
    </div>
  );
}

export default React.memo(Authors);
