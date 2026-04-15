import React, { useEffect, useMemo, useState } from "react";
import { HiCheckBadge } from "react-icons/hi2";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  selectAuthUser,
} from "../features/auth/authSlice";
import { Container } from "../components";
import { clearAuthSession } from "../features/auth/authSlice";
import { clearStoredAuthTokens, getStoredRefreshToken } from "../features/auth/authSession";
import { getDashboardPathForUser, hasRole } from "../utils/roleHelpers";
import { isVerifiedAuthor } from "../utils/postHelpers";
import {
  useApplyForAuthorMutation,
  useLogoutMutation,
  useUpdateUserAvatarMutation,
  useUserProfileQuery,
} from "../features/auth/useAuthQueries";
import { useDeletePostMutation, usePostsQuery } from "../features/post/usePostQueries";
import ManagedPostsSection from "../components/Profile/ManagedPostsSection";
import AuthorDashboard from "./AuthorDashboard";

const getUserId = (user) =>
  user?._id || user?.id || user?.userId || user?.data?._id || null;

const getDisplayName = (user) =>
  user?.username ||
  user?.fullName ||
  user?.name ||
  user?.data?.username ||
  user?.data?.fullName ||
  "User";

const getUserEmail = (user) =>
  user?.email || user?.data?.email || "";

const getUserBio = (user) =>
  user?.bio || user?.about || user?.data?.bio || "";

const getAvatarUrl = (user) =>
  user?.avatar?.url ||
  user?.avatar ||
  user?.profilePic?.url ||
  user?.profilePic ||
  user?.image ||
  "";

const getPostOwnerId = (post) =>
  post?.owner?._id ||
  post?.owner?.id ||
  (typeof post?.owner === "string" ? post.owner : null) ||
  post?.author?._id ||
  post?.author?.id ||
  post?.authorId ||
  post?.userId ||
  post?.ownerId ||
  null;

function Profile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userProfileQuery = useUserProfileQuery(true);
  const postsQuery = usePostsQuery();
  const updateAvatarMutation = useUpdateUserAvatarMutation();
  const applyForAuthorMutation = useApplyForAuthorMutation();
  const user = useSelector(selectAuthUser);
  const logoutMutation = useLogoutMutation();
  const deletePostMutation = useDeletePostMutation();
  const loading =
    userProfileQuery.isFetching ||
    postsQuery.isFetching ||
    updateAvatarMutation.isPending ||
    applyForAuthorMutation.isPending ||
    logoutMutation.isPending;
  const error = "";
  const message = "";
  const allPosts = useMemo(() => postsQuery.data || [], [postsQuery.data]);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [authorForm, setAuthorForm] = useState({
    motivation: "",
    experience: "",
    portfolioUrl: "",
  });
  const [authorApplying, setAuthorApplying] = useState(false);
  const [authorApplyStatus, setAuthorApplyStatus] = useState("");
  const [authorApplyError, setAuthorApplyError] = useState("");

  useEffect(() => {
    if (!user) return;
    setAvatarPreview("");
    setAvatarFile(null);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (hasRole(user, ["admin", "superadmin"])) {
      navigate(getDashboardPathForUser(user), { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const myPosts = useMemo(() => {
    const currentUserId = getUserId(user);
    if (!currentUserId || !Array.isArray(allPosts)) return [];
    return allPosts.filter((post) => getPostOwnerId(post) === currentUserId);
  }, [allPosts, user]);

  const alreadyAuthor = useMemo(
    () => hasRole(user, ["author", "admin", "superadmin"]),
    [user]
  );
  const isAuthorAccount = useMemo(() => hasRole(user, ["author"]), [user]);
  const isProfileVerified = useMemo(() => isVerifiedAuthor(user), [user]);

  const totalViews = useMemo(
    () => myPosts.reduce((sum, post) => sum + Number(post?.views || 0), 0),
    [myPosts]
  );

  const totalLikes = useMemo(
    () =>
      myPosts.reduce((sum, post) => {
        const likesCount =
          post?.likesCount ??
          (Array.isArray(post?.likes) ? post.likes.length : Number(post?.likes) || 0);
        return sum + Number(likesCount || 0);
      }, 0),
    [myPosts]
  );

  const handleSelectAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;

    const formData = new FormData();
    formData.append("avatar", avatarFile);

    try {
      await updateAvatarMutation.mutateAsync(formData);
      setAvatarFile(null);
      setAvatarPreview("");
    } catch {
      // error handled by slice/UI
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post permanently?")) return;

    try {
      await deletePostMutation.mutateAsync(postId);
      await postsQuery.refetch();
    } catch {
      alert("Failed to delete post.");
    }
  };

  const handleLogout = () => {
    const refreshToken = getStoredRefreshToken();
    dispatch(clearAuthSession());
    clearStoredAuthTokens();
    navigate("/", { replace: true });
    logoutMutation.mutate({ refreshToken });
  };

  const handleApplyForAuthor = async () => {
    const payload = {
      motivation: authorForm.motivation.trim(),
      experience: authorForm.experience.trim(),
      portfolioUrl: authorForm.portfolioUrl.trim(),
    };

    if (!payload.motivation) {
      setAuthorApplyError("Please add your motivation before submitting.");
      setAuthorApplyStatus("");
      return;
    }

    setAuthorApplying(true);
    setAuthorApplyError("");
    setAuthorApplyStatus("");

    try {
      const response = await applyForAuthorMutation.mutateAsync(payload);
      setAuthorApplyStatus(response?.message || "Author application submitted successfully.");
      setAuthorForm({ motivation: "", experience: "", portfolioUrl: "" });
    } catch (err) {
      setAuthorApplyError(err?.response?.data?.message || err?.message || "Failed to submit author application.");
    } finally {
      setAuthorApplying(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-16 bg-background dark:bg-background">
        <Container>
          <div className="max-w-xl mx-auto bg-light rounded-2xl shadow-md border border-beige p-8 text-center dark:bg-background dark:border-light/20">
            <h2 className="text-2xl font-bold text-dark dark:text-light">Profile not available</h2>
            <p className="text-dark/70 mt-2 dark:text-light/80">Please login again to view your profile.</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 px-5 py-2.5 rounded-lg bg-primary text-light font-semibold hover:opacity-90"
            >
              Go to Login
            </button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 md:pt-32 pb-16 bg-background dark:bg-background">
      <Container>
        <div className="max-w-7xl mx-auto space-y-8">
          <section className="rounded-3xl border border-beige bg-light shadow-xl p-5 sm:p-6 md:p-8 dark:bg-background dark:border-light/20">
            <div className="flex flex-col xl:flex-row gap-6 xl:items-center xl:justify-between">
              <div className="flex items-center gap-4 sm:gap-5 md:gap-6 min-w-0">
                <div className="relative">
                  <img
                    src={avatarPreview || getAvatarUrl(user) || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt={getDisplayName(user)}
                    className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl object-cover border-2 border-beige dark:border-light/20 shadow-md"
                  />
                  <label className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-primary text-light flex items-center justify-center cursor-pointer border-2 border-light shadow">
                    <input type="file" accept="image/*" className="hidden" onChange={handleSelectAvatar} />
                    <span className="text-sm font-bold">+</span>
                  </label>
                </div>

                <div className="min-w-0">
                  <h1 className="inline-flex items-center gap-2 text-2xl sm:text-3xl md:text-4xl font-black text-dark dark:text-light truncate">
                    <span className="truncate">{getDisplayName(user)}</span>
                    {isProfileVerified && (
                      <HiCheckBadge className="h-6 w-6 text-primary shrink-0" title="Verified author" />
                    )}
                  </h1>
                  <p className="text-dark/70 mt-1 text-sm sm:text-base truncate dark:text-light/80">{getUserEmail(user)}</p>
                  <p className="text-sm text-dark/60 mt-2 leading-relaxed dark:text-light/70 max-w-2xl">
                    {getUserBio(user) || "Add a short bio to complete your profile."}
                  </p>
                </div>
              </div>

              <div className="w-full xl:w-auto">
                <div className="rounded-2xl bg-background border border-beige px-4 py-4 dark:bg-background dark:border-light/20">
                  <div className="grid grid-cols-3 gap-3 text-center min-w-0">
                    <div className="rounded-xl bg-light px-3 py-3 dark:bg-background">
                      <p className="text-2xl font-black text-dark dark:text-light">{myPosts.length}</p>
                      <p className="text-xs sm:text-sm text-dark/60 dark:text-light/70">Managed Posts</p>
                    </div>
                    <div className="rounded-xl bg-light px-3 py-3 dark:bg-background">
                      <p className="text-2xl font-black text-dark dark:text-light">{totalViews}</p>
                      <p className="text-xs sm:text-sm text-dark/60 dark:text-light/70">Views</p>
                    </div>
                    <div className="rounded-xl bg-light px-3 py-3 dark:bg-background">
                      <p className="text-2xl font-black text-dark dark:text-light">{totalLikes}</p>
                      <p className="text-xs sm:text-sm text-dark/60 dark:text-light/70">Likes</p>
                    </div>
                  </div>

                 
                </div>
                 <Link
                    to="/profile/connections"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3.5 text-base font-bold text-white shadow-sm hover:opacity-90"
                  >
                    Connections
                  </Link>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/profile/settings"
                className="h-10 px-4 inline-flex items-center rounded-xl bg-primary text-light text-sm font-semibold hover:opacity-90"
              >
                Update Profile
              </Link>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="h-10 px-4 inline-flex items-center rounded-xl bg-warning text-light text-sm font-semibold hover:bg-warning/90 disabled:opacity-60"
              >
                {loading ? "Please wait..." : "Logout"}
              </button>
            </div>

            {avatarFile && (
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={handleUploadAvatar}
                  disabled={loading}
                  className="h-10 px-4 inline-flex items-center rounded-xl bg-primary text-light text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? "Uploading..." : "Upload Avatar"}
                </button>
                <button
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview("");
                  }}
                  className="h-10 px-4 inline-flex items-center rounded-xl border border-beige text-dark text-sm font-semibold hover:bg-background dark:border-light/20 dark:text-light dark:hover:bg-background"
                >
                  Cancel
                </button>
              </div>
            )}
          </section>

          {isAuthorAccount && <AuthorDashboard embedded />}

          {message && (
            <div className="rounded-xl border border-accent/25 bg-light px-4 py-3 text-accent font-medium dark:bg-background dark:border-accent/35 dark:text-accent">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-warning/25 bg-light px-4 py-3 text-warning font-medium dark:bg-background dark:border-warning/35 dark:text-warning">
              {error}
            </div>
          )}

          {!hasRole(user, ["author"]) && (
            <section className="rounded-3xl border border-beige bg-light shadow-lg p-5 sm:p-6 dark:bg-background dark:border-light/20">
              {!alreadyAuthor && (
              <div className="mb-6 rounded-2xl border border-warning/25 bg-background p-4 sm:p-5 dark:border-warning/35 dark:bg-background">
                <h3 className="text-lg sm:text-xl font-black text-warning">Apply for Author Role</h3>
                <p className="mt-1 text-sm text-dark/70 dark:text-light/80">
                  Submit your details for review. Approved users can publish and manage posts.
                </p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <textarea
                    value={authorForm.motivation}
                    onChange={(event) =>
                      setAuthorForm((prev) => ({ ...prev, motivation: event.target.value }))
                    }
                    rows={4}
                    placeholder="Why do you want to become an author?"
                    className="md:col-span-2 rounded-xl border border-warning/30 bg-light px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-warning/40 dark:border-warning/35 dark:bg-background dark:text-light"
                  />
                  <textarea
                    value={authorForm.experience}
                    onChange={(event) =>
                      setAuthorForm((prev) => ({ ...prev, experience: event.target.value }))
                    }
                    rows={3}
                    placeholder="Any writing or technical experience (optional)"
                    className="rounded-xl border border-warning/30 bg-light px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-warning/40 dark:border-warning/35 dark:bg-background dark:text-light"
                  />
                  <input
                    type="url"
                    value={authorForm.portfolioUrl}
                    onChange={(event) =>
                      setAuthorForm((prev) => ({ ...prev, portfolioUrl: event.target.value }))
                    }
                    placeholder="Portfolio URL (optional)"
                    className="rounded-xl border border-warning/30 bg-light px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-warning/40 dark:border-warning/35 dark:bg-background dark:text-light"
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleApplyForAuthor}
                    disabled={authorApplying || loading}
                    className="h-10 px-4 inline-flex items-center rounded-xl bg-primary text-light text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
                  >
                    {authorApplying ? "Submitting..." : "Submit Application"}
                  </button>
                  {authorApplyStatus && (
                    <p className="text-sm font-medium text-accent">{authorApplyStatus}</p>
                  )}
                  {authorApplyError && (
                    <p className="text-sm font-medium text-warning">{authorApplyError}</p>
                  )}
                </div>
              </div>
              )}

              <ManagedPostsSection posts={myPosts} onDeletePost={handleDeletePost} />
            </section>
          )}

        </div>
      </Container>
    </div>
  );
}

export default React.memo(Profile);
