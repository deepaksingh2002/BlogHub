import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { HiOutlineArrowLeft, HiOutlineTrash } from "react-icons/hi2";
import { Container } from "../components";
import { selectAuthUser } from "../features/auth/authSlice";
import { useAdminUserProfileQuery, useDeleteUserMutation } from "../features/admin/useAdminQueries";
import { hasRole } from "../utils/roleHelpers";

const getDisplayName = (user) => user?.fullName || user?.username || user?.email || "User";

const getAvatarUrl = (user) => user?.avatar?.url || user?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const getRoleLabel = (user) => {
  const role = String(user?.role || "user").toLowerCase();
  if (role === "superadmin") return "Super Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

function AdminUserProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const currentUser = useSelector(selectAuthUser);
  const isAdmin = hasRole(currentUser, ["admin", "superadmin"]);

  const userProfileQuery = useAdminUserProfileQuery(userId, isAdmin);
  const deleteUserMutation = useDeleteUserMutation();

  const profile = userProfileQuery.data?.user || {};
  const recentPosts = userProfileQuery.data?.recentPosts || [];
  const targetRole = String(profile?.role || "user").toLowerCase();
  const protectedUser = ["admin", "superadmin"].includes(targetRole) || String(profile?._id || "") === String(currentUser?._id || "");

  const handleDelete = async () => {
    if (!profile?._id) return;
    if (!window.confirm("Delete this user permanently? This removes their posts, comments, likes, and follows.")) {
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(profile._id);
      navigate("/admin/users");
    } catch (error) {
      if (error?.statusCode === 401) {
        navigate("/login");
      }
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-12 bg-background dark:bg-background">
      <Container>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-2 rounded-xl border border-beige bg-light px-4 py-2 text-sm font-semibold text-dark hover:bg-background dark:border-light/20 dark:bg-background dark:text-light dark:hover:bg-background"
            >
              <HiOutlineArrowLeft className="h-4 w-4" />
              Back to Users
            </Link>

            <button
              type="button"
              onClick={handleDelete}
              disabled={protectedUser || deleteUserMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-warning/30 bg-light px-4 py-2 text-sm font-semibold text-warning hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 dark:border-warning/40 dark:bg-background dark:text-warning dark:hover:bg-background"
              title={protectedUser ? "Protected account" : "Delete user"}
            >
              <HiOutlineTrash className="h-4 w-4" />
              Delete User
            </button>
          </div>

          {userProfileQuery.error && (
            <p className="rounded-xl border border-warning/30 bg-light px-4 py-3 text-sm font-medium text-warning dark:border-warning/40 dark:bg-background dark:text-warning">
              {userProfileQuery.error?.message || "Failed to load user profile"}
            </p>
          )}

          <section className="rounded-[1.6rem] border border-beige bg-light p-6 sm:p-8 shadow-[0_24px_60px_-40px_rgba(30,41,59,0.25)] dark:bg-background dark:border-light/20">
            <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <img
                  src={getAvatarUrl(profile)}
                  alt={getDisplayName(profile)}
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl object-cover border border-beige dark:border-light/20 shrink-0"
                />

                <div className="min-w-0 space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">User Profile</p>
                    <h1 className="mt-2 text-3xl sm:text-4xl font-black text-dark dark:text-light truncate">
                      {getDisplayName(profile)}
                    </h1>
                    <p className="mt-1 text-sm sm:text-base text-dark/70 dark:text-light/80 truncate">
                      @{profile?.username || "unknown"} · {profile?.email || "No email"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-background px-3 py-1 text-xs font-bold text-primary dark:bg-background dark:text-primary">
                      {getRoleLabel(profile)}
                    </span>
                    <span className="inline-flex rounded-full bg-background px-3 py-1 text-xs font-bold text-secondary dark:bg-background dark:text-secondary">
                      Posts {Number(profile?.postCount || 0)}
                    </span>
                    <span className="inline-flex rounded-full bg-background px-3 py-1 text-xs font-bold text-primary dark:bg-background dark:text-primary">
                      Followers {Number(profile?.followerCount || 0)}
                    </span>
                    <span className="inline-flex rounded-full bg-background px-3 py-1 text-xs font-bold text-accent dark:bg-background dark:text-accent">
                      Following {Number(profile?.followingCount || 0)}
                    </span>
                  </div>

                  <p className="max-w-3xl text-sm sm:text-base leading-7 text-dark/80 dark:text-light/80">
                    {profile?.bio || "No bio provided for this account."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:w-full lg:max-w-md">
                <div className="rounded-2xl bg-background border border-beige px-4 py-3 text-center dark:bg-background dark:border-light/20">
                  <p className="text-2xl font-black text-dark dark:text-light">{Number(profile?.postCount || 0)}</p>
                  <p className="text-xs text-dark/70 dark:text-light/80">Posts</p>
                </div>
                <div className="rounded-2xl bg-background border border-beige px-4 py-3 text-center dark:bg-background dark:border-light/20">
                  <p className="text-2xl font-black text-dark dark:text-light">{Number(profile?.followerCount || 0)}</p>
                  <p className="text-xs text-dark/70 dark:text-light/80">Followers</p>
                </div>
                <div className="rounded-2xl bg-background border border-beige px-4 py-3 text-center dark:bg-background dark:border-light/20">
                  <p className="text-2xl font-black text-dark dark:text-light">{Number(profile?.followingCount || 0)}</p>
                  <p className="text-xs text-dark/70 dark:text-light/80">Following</p>
                </div>
                <div className="rounded-2xl bg-background border border-beige px-4 py-3 text-center dark:bg-background dark:border-light/20">
                  <p className="text-2xl font-black text-dark dark:text-light">{Number(profile?.commentCount || 0)}</p>
                  <p className="text-xs text-dark/70 dark:text-light/80">Comments</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-beige bg-light p-6 sm:p-8 shadow-[0_24px_60px_-40px_rgba(30,41,59,0.25)] dark:bg-background dark:border-light/20">
            <h2 className="text-2xl font-black text-dark dark:text-light">Recent Posts</h2>
            <p className="mt-1 text-sm text-dark/70 dark:text-light/80">Latest posts from this account.</p>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {recentPosts.length ? (
                recentPosts.map((post) => (
                  <article
                    key={post._id}
                    className="rounded-2xl border border-beige bg-background p-4 shadow-sm dark:border-light/20 dark:bg-background"
                  >
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      className="h-40 w-full rounded-xl object-cover"
                    />
                    <h3 className="mt-4 text-lg font-bold text-dark dark:text-light line-clamp-2">
                      {post.title}
                    </h3>
                    <div className="mt-2 flex items-center justify-between text-sm text-dark/70 dark:text-light/80">
                      <span>{post.catagry || "Uncategorized"}</span>
                      <span>{Number(post.views || 0)} views</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Link
                        to={`/post/${post._id}`}
                        className="inline-flex items-center rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white"
                      >
                        Open Post
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-dark/70 dark:text-light/80">No posts found for this user.</p>
              )}
            </div>
          </section>
        </div>
      </Container>
    </div>
  );
}

export default React.memo(AdminUserProfile);