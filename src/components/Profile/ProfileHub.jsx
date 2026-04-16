import React, { useEffect, useMemo, useState } from "react";
import { HiCheckBadge, HiOutlineShieldCheck } from "react-icons/hi2";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Container } from "..";
import AdminUsersPanel from "../Admin/AdminUsersPanel";
import ChangePasswordForm from "./ChangePasswordForm";
import ManagedPostsSection from "./ManagedPostsSection";
import ProfileDetailsForm from "./ProfileDetailsForm";
import SubscriberConnections from "./SubscriberConnections";
import AuthorDashboard from "../../pages/AuthorDashboard";
import { clearAuthSession, selectAuthUser } from "../../features/auth/authSlice";
import { clearStoredAuthTokens, getStoredRefreshToken } from "../../features/auth/authSession";
import {
  useApplyForAuthorMutation,
  useChangePasswordMutation,
  useLogoutMutation,
  useUpdateUserAvatarMutation,
  useUpdateUserProfileMutation,
  useUserProfileQuery,
} from "../../features/auth/useAuthQueries";
import { useAdminOverviewQuery, useAdminUsersQuery, useUpdateAdminProfileMutation } from "../../features/admin/useAdminQueries";
import { useDeletePostMutation, usePostsQuery } from "../../features/post/usePostQueries";
import { useAuthorsListQuery, useFollowersListQuery } from "../../features/subscription/useSubscriptionQueries";
import { isVerifiedAuthor } from "../../utils/postHelpers";
import { hasRole } from "../../utils/roleHelpers";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
const ADMIN_ROLES = ["admin", "superadmin"];

const getUserId = (user) => user?._id || user?.id || user?.userId || user?.data?._id || null;

const getDisplayName = (user) =>
  user?.username ||
  user?.fullName ||
  user?.name ||
  user?.data?.username ||
  user?.data?.fullName ||
  "User";

const getUserEmail = (user) => user?.email || user?.data?.email || "";

const getUserBio = (user) => user?.bio || user?.about || user?.data?.bio || "";

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

const ProfileUnavailable = ({ title, description, actionLabel, onAction }) => (
  <div className="min-h-screen pt-32 pb-16 bg-background dark:bg-background">
    <Container>
      <div className="max-w-xl mx-auto bg-light rounded-2xl shadow-md border border-beige p-8 text-center dark:bg-background dark:border-light/20">
        <h2 className="text-2xl font-bold text-dark dark:text-light">{title}</h2>
        <p className="text-dark/70 mt-2 dark:text-light/80">{description}</p>
        <button
          onClick={onAction}
          className="mt-6 px-5 py-2.5 rounded-lg bg-primary text-light font-semibold hover:opacity-90"
        >
          {actionLabel}
        </button>
      </div>
    </Container>
  </div>
);

function UserProfileView({ user, loading, navigate, dispatch, logoutMutation, updateAvatarMutation, applyForAuthorMutation, deletePostMutation, onUpdateProfile, updateProfilePending, onChangePassword, changePasswordPending }) {
  const postsQuery = usePostsQuery({}, { enabled: Boolean(user) });
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
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
  const [connectionsSearch, setConnectionsSearch] = useState("");
  const [profileUpdateMessage, setProfileUpdateMessage] = useState("");
  const [profileUpdateError, setProfileUpdateError] = useState("");
  const [updateModalTab, setUpdateModalTab] = useState("profile");

  const currentUserId = getUserId(user);
  const authorsQuery = useAuthorsListQuery(Boolean(user));
  const followersQuery = useFollowersListQuery(currentUserId, Boolean(currentUserId));

  useEffect(() => {
    if (!user) return;
    setAvatarPreview("");
    setAvatarFile(null);
  }, [user]);

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

  const alreadyAuthor = useMemo(() => hasRole(user, ["author", "admin", "superadmin"]), [user]);
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

  const handleSelectAvatar = (event) => {
    const file = event.target.files?.[0];
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
    logoutMutation.mutate(
      { refreshToken },
      {
        onSettled: () => {
          navigate("/", { replace: true });
          window.location.reload(); // Force full reload to clear all state
        },
      }
    );
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
    } catch (error) {
      setAuthorApplyError(
        error?.response?.data?.message || error?.message || "Failed to submit author application."
      );
    } finally {
      setAuthorApplying(false);
    }
  };

  const openUpdateModal = () => {
    setProfileUpdateError("");
    setProfileUpdateMessage("");
    setUpdateModalTab("profile");
    setIsUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    if (updateProfilePending || changePasswordPending) return;
    setProfileUpdateError("");
    setIsUpdateModalOpen(false);
  };

  const handleUpdateProfile = async (data) => {
    try {
      setProfileUpdateError("");
      const response = await onUpdateProfile(data);
      setProfileUpdateMessage(response?.message || response?.data?.message || "Profile updated successfully");
      setIsUpdateModalOpen(false);
    } catch (error) {
      setProfileUpdateError(error?.response?.data?.message || error?.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async (payload) => {
    try {
      setProfileUpdateError("");
      const response = await onChangePassword(payload);
      setProfileUpdateMessage(response?.message || response?.data?.message || "Password changed successfully");
      setIsUpdateModalOpen(false);
    } catch (error) {
      setProfileUpdateError(error?.response?.data?.message || error?.message || "Failed to change password");
    }
  };

  const following = useMemo(() => {
    const authors = Array.isArray(authorsQuery.data) ? authorsQuery.data : [];
    return authors.filter((author) => {
      const role = String(author?.role || "").toLowerCase();
      return role === "author" && Boolean(author?.isFollowing);
    });
  }, [authorsQuery.data]);

  const followers = useMemo(() => Array.isArray(followersQuery.data) ? followersQuery.data : [], [followersQuery.data]);

  if (!user) {
    return (
      <ProfileUnavailable
        title="Profile not available"
        description="Please login again to view your profile."
        actionLabel="Go to Login"
        onAction={() => navigate("/login")}
      />
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
                    src={avatarPreview || getAvatarUrl(user) || DEFAULT_AVATAR}
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
                <button
                  type="button"
                  onClick={() => setIsConnectionsModalOpen(true)}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3.5 text-base font-bold text-white shadow-sm hover:opacity-90"
                >
                  Connections
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openUpdateModal}
                className="h-10 px-4 inline-flex items-center rounded-xl bg-primary text-light text-sm font-semibold hover:opacity-90"
              >
                Update Profile
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="h-10 px-4 inline-flex items-center rounded-xl bg-warning text-light text-sm font-semibold hover:bg-warning/90 disabled:opacity-60"
              >
                {loading || logoutMutation.isPending ? "Please wait..." : "Logout"}
              </button>
            </div>

            {(profileUpdateMessage || profileUpdateError) && (
              <div className="mt-4">
                <div
                  className={`rounded-xl px-4 py-3 text-sm font-medium ${
                    profileUpdateError
                      ? "border border-warning/30 bg-warning/10 text-warning"
                      : "border border-secondary/30 bg-secondary/10 text-secondary"
                  }`}
                >
                  {profileUpdateError || profileUpdateMessage}
                </div>
              </div>
            )}

            {avatarFile && (
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={handleUploadAvatar}
                  disabled={loading}
                  className="h-10 px-4 inline-flex items-center rounded-xl bg-primary text-light text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                >
                  {updateAvatarMutation.isPending ? "Uploading..." : "Upload Avatar"}
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

          {isUpdateModalOpen && (
            <div className="fixed inset-0 z-120 grid place-items-center bg-dark/65 p-4" role="dialog" aria-modal="true">
              <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-beige bg-light p-5 sm:p-6 shadow-2xl dark:border-light/20 dark:bg-background">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl sm:text-2xl font-black text-dark dark:text-light">Account Settings</h2>
                  <button
                    type="button"
                    onClick={closeUpdateModal}
                    disabled={updateProfilePending || changePasswordPending}
                    className="rounded-lg border border-beige px-3 py-1.5 text-sm font-semibold text-dark hover:bg-background disabled:opacity-60 dark:border-light/20 dark:text-light dark:hover:bg-background"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileUpdateError("");
                      setUpdateModalTab("profile");
                    }}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      updateModalTab === "profile"
                        ? "bg-primary text-white"
                        : "border border-beige text-dark hover:bg-background dark:border-light/20 dark:text-light dark:hover:bg-background"
                    }`}
                  >
                    Update Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileUpdateError("");
                      setUpdateModalTab("password");
                    }}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      updateModalTab === "password"
                        ? "bg-primary text-white"
                        : "border border-beige text-dark hover:bg-background dark:border-light/20 dark:text-light dark:hover:bg-background"
                    }`}
                  >
                    Change Password
                  </button>
                </div>

                <div className="mt-5">
                  {updateModalTab === "profile" ? (
                    <ProfileDetailsForm
                      user={user}
                      loading={updateProfilePending}
                      onSubmit={handleUpdateProfile}
                    />
                  ) : (
                    <ChangePasswordForm
                      loading={changePasswordPending}
                      onSubmit={handleChangePassword}
                    />
                  )}
                </div>

                {profileUpdateError && (
                  <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
                    {profileUpdateError}
                  </div>
                )}
              </div>
            </div>
          )}

          {isConnectionsModalOpen && (
            <div className="fixed inset-0 z-120 grid place-items-center bg-dark/65 p-4" role="dialog" aria-modal="true">
              <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl border border-beige bg-light p-5 sm:p-6 shadow-2xl dark:border-light/20 dark:bg-background">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-center flex-1 text-xl sm:text-2xl font-black text-dark dark:text-light">Connections</h2>
                  <button
                    type="button"
                    onClick={() => setIsConnectionsModalOpen(false)}
                    className="rounded-lg border border-beige px-3 py-1.5 text-sm font-semibold text-dark hover:bg-background dark:border-light/20 dark:text-light dark:hover:bg-background"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4">
                  <input
                    type="search"
                    placeholder="Search connections"
                    value={connectionsSearch}
                    onChange={(event) => setConnectionsSearch(event.target.value)}
                    className="w-full rounded-2xl border border-beige bg-background px-4 py-3 text-sm text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-light/20 dark:bg-background dark:text-light"
                  />
                </div>

                <div className="mt-5">
                  <SubscriberConnections following={following} followers={followers} searchTerm={connectionsSearch} />
                </div>
              </div>
            </div>
          )}

          {isAuthorAccount && <AuthorDashboard embedded />}

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
                    {authorApplyStatus && <p className="text-sm font-medium text-accent">{authorApplyStatus}</p>}
                    {authorApplyError && <p className="text-sm font-medium text-warning">{authorApplyError}</p>}
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

function SettingsProfileView({ user, loading, onUpdateProfile, onChangePassword }) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setError("");
    setMessage("");
  }, []);

  const handleUpdateProfile = async (data) => {
    try {
      setError("");
      const response = await onUpdateProfile(data);
      setMessage(response?.message || response?.data?.message || "Profile updated successfully");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async (data) => {
    try {
      setError("");
      const response = await onChangePassword(data);
      setMessage(response?.message || response?.data?.message || "Password changed successfully");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to change password");
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-16 bg-linear-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-950">
      <Container>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-slate-100">Profile Settings</h1>
            <Link
              to="/profile"
              className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Back to Profile
            </Link>
          </div>

          {message && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 font-medium dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 font-medium dark:bg-red-950/30 dark:border-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          <ProfileDetailsForm user={user} loading={loading} onSubmit={handleUpdateProfile} />
          <ChangePasswordForm loading={loading} onSubmit={handleChangePassword} />
        </div>
      </Container>
    </div>
  );
}

function AdminProfileView({ currentUser, logoutMutation, updateAdminProfileMutation }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAdmin = useMemo(() => hasRole(currentUser, ADMIN_ROLES), [currentUser]);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileForm, setProfileForm] = useState({ fullName: "", bio: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const overviewQuery = useAdminOverviewQuery(isAdmin);
  const usersQuery = useAdminUsersQuery(
    {
      page: 1,
      limit: 6,
      role: "user",
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    isAdmin
  );
  const authorsQuery = useAdminUsersQuery(
    {
      page: 1,
      limit: 6,
      role: "author",
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    isAdmin
  );

  const profile = overviewQuery.data?.profile || {};
  const profileAvatar =
    profile?.avatar?.url || profile?.avatar || currentUser?.avatar?.url || currentUser?.avatar || DEFAULT_AVATAR;

  useEffect(() => {
    setProfileForm({
      fullName: profile?.fullName || currentUser?.fullName || "",
      bio: profile?.bio || currentUser?.bio || "",
    });
  }, [currentUser?.bio, currentUser?.fullName, profile?.bio, profile?.fullName]);

  useEffect(() => {
    if (avatarPreview?.startsWith("blob:")) {
      return () => URL.revokeObjectURL(avatarPreview);
    }
    return undefined;
  }, [avatarPreview]);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Image size should be less than 5MB.");
      return;
    }

    setProfileError("");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");

    const formData = new FormData();
    formData.append("fullName", profileForm.fullName.trim());
    formData.append("bio", profileForm.bio.trim());
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      const response = await updateAdminProfileMutation.mutateAsync(formData);
      setProfileMessage(response?.message || "Admin profile updated successfully");
      setAvatarFile(null);
      setAvatarPreview("");
      setIsEditModalOpen(false);
    } catch (error) {
      setProfileError(error?.message || "Failed to update profile");
    }
  };

  const openEditModal = () => {
    setProfileError("");
    setAvatarFile(null);
    setAvatarPreview("");
    setProfileForm({
      fullName: profile?.fullName || currentUser?.fullName || "",
      bio: profile?.bio || currentUser?.bio || "",
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    if (updateAdminProfileMutation.isPending) return;
    setIsEditModalOpen(false);
    setAvatarFile(null);
    setAvatarPreview("");
    setProfileError("");
  };

  const handleLogout = () => {
    const refreshToken = getStoredRefreshToken();
    dispatch(clearAuthSession());
    clearStoredAuthTokens();
    navigate("/", { replace: true });
    logoutMutation.mutate({ refreshToken });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-28 pb-12 bg-background dark:bg-background">
        <Container>
          <div className="max-w-3xl mx-auto rounded-3xl border border-warning/30 bg-light p-8 text-center dark:border-warning/40 dark:bg-background">
            <HiOutlineShieldCheck className="mx-auto h-12 w-12 text-warning" />
            <h1 className="mt-4 text-2xl font-black text-dark dark:text-light">Admin Access Required</h1>
            <p className="mt-2 text-sm sm:text-base text-dark/70 dark:text-light/80">
              This page is available only for administrator accounts.
            </p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 md:pt-32 pb-12 bg-background dark:bg-background">
      <Container>
        <div className="max-w-7xl mx-auto space-y-6">
          <section className="rounded-3xl border border-beige bg-light shadow-xl p-5 sm:p-6 md:p-8 dark:bg-background dark:border-light/20">
            <div className="flex flex-col xl:flex-row gap-6 xl:items-center xl:justify-between">
              <div className="flex items-center gap-4 sm:gap-5 md:gap-6 min-w-0">
                <img
                  src={profileAvatar}
                  alt={profile?.fullName || "Admin"}
                  className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl object-cover border-2 border-beige dark:border-light/20 shadow-md"
                />
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-dark dark:text-light truncate">
                    {profile?.fullName || currentUser?.fullName || "Administrator"}
                  </h1>
                  <p className="text-dark/70 mt-1 text-sm sm:text-base truncate dark:text-light/80">
                    @{profile?.username || currentUser?.username || "admin"}
                  </p>
                  <p className="text-sm text-dark/60 mt-2 leading-relaxed dark:text-light/70 max-w-2xl">
                    {profile?.bio || currentUser?.bio || "Welcome to Admin. Manage platform users, content, and moderation from this dashboard."}
                  </p>
                </div>
              </div>

              <div className="w-full xl:w-auto">
                <div className="rounded-2xl bg-background border border-beige px-4 py-4 dark:bg-background dark:border-light/20">
                  <div className="grid grid-cols-2 gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={openEditModal}
                      className="h-10 px-4 inline-flex items-center justify-center rounded-xl bg-primary text-light text-sm font-semibold hover:opacity-90"
                    >
                      Edit Profile
                    </button>
                    <Link
                      to="/admin/dashboard"
                      className="h-10 px-4 inline-flex items-center justify-center rounded-xl border border-beige bg-background text-sm font-semibold text-dark hover:bg-light dark:border-light/20 dark:bg-background dark:text-light dark:hover:bg-background"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/dashboard#admin-users-section"
                      className="h-10 px-4 inline-flex items-center justify-center rounded-xl bg-primary text-light text-sm font-semibold hover:opacity-90"
                    >
                      Users
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                      className="h-10 px-4 inline-flex items-center justify-center rounded-xl bg-warning text-light text-sm font-semibold hover:bg-warning/90 disabled:opacity-60"
                    >
                      {logoutMutation.isPending ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {(profileMessage || profileError) && (
              <div className="mt-4">
                <div
                  className={`rounded-xl px-4 py-3 text-sm font-medium ${
                    profileError
                      ? "border border-warning/30 bg-warning/10 text-warning"
                      : "border border-secondary/30 bg-secondary/10 text-secondary"
                  }`}
                >
                  {profileError || profileMessage}
                </div>
              </div>
            )}

          </section>

          {isEditModalOpen && (
            <div className="fixed inset-0 z-120 flex items-center justify-center bg-dark/65 p-4" role="dialog" aria-modal="true">
              <div className="w-full max-w-xl rounded-3xl border border-beige bg-light p-5 sm:p-6 shadow-2xl dark:border-light/20 dark:bg-background">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl sm:text-2xl font-black text-dark dark:text-light">Update Admin Profile</h2>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={updateAdminProfileMutation.isPending}
                    className="rounded-lg border border-beige px-3 py-1.5 text-sm font-semibold text-dark hover:bg-background disabled:opacity-60 dark:border-light/20 dark:text-light dark:hover:bg-background"
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleProfileSave} className="mt-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={avatarPreview || profileAvatar}
                      alt={profile?.fullName || "Admin"}
                      className="h-20 w-20 rounded-2xl object-cover border border-beige dark:border-light/20"
                    />
                    <div className="space-y-2">
                      <label className="inline-flex cursor-pointer items-center rounded-xl border border-beige bg-background px-4 py-2 text-sm font-semibold text-dark hover:bg-light dark:border-light/20 dark:bg-background dark:text-light dark:hover:bg-background">
                        Choose avatar
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                      </label>
                      <p className="text-xs text-dark/60 dark:text-light/70">PNG, JPG, or WEBP up to 5MB.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-dark dark:text-light mb-2">Full name</label>
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))}
                      className="w-full rounded-xl border border-beige bg-background px-4 py-2.5 text-dark outline-none transition focus:border-primary dark:border-light/20 dark:bg-background dark:text-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-dark dark:text-light mb-2">Bio</label>
                    <textarea
                      rows={4}
                      value={profileForm.bio}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, bio: event.target.value }))}
                      className="w-full rounded-xl border border-beige bg-background px-4 py-2.5 text-dark outline-none transition focus:border-primary dark:border-light/20 dark:bg-background dark:text-light"
                    />
                  </div>

                  {profileError && (
                    <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
                      {profileError}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={closeEditModal}
                      disabled={updateAdminProfileMutation.isPending}
                      className="inline-flex items-center rounded-xl border border-beige px-4 py-2.5 text-sm font-semibold text-dark hover:bg-background disabled:opacity-60 dark:border-light/20 dark:text-light dark:hover:bg-background"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateAdminProfileMutation.isPending}
                      className="inline-flex items-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                    >
                      {updateAdminProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AdminUsersPanel
              title="Recent Users"
              users={usersQuery.data?.users || []}
              loading={usersQuery.isLoading || usersQuery.isFetching}
              viewAllTo="/admin/dashboard#admin-users-section"
            />
            <AdminUsersPanel
              title="Recent Authors"
              users={authorsQuery.data?.users || []}
              loading={authorsQuery.isLoading || authorsQuery.isFetching}
              viewAllTo="/admin/dashboard#admin-users-section"
            />
          </section>
        </div>
      </Container>
    </div>
  );
}

function ProfileHub({ mode = "profile" }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectAuthUser);
  const isAdminAccount = hasRole(currentUser, ADMIN_ROLES);
  const resolvedMode =
    mode === "admin" || (mode === "settings" && isAdminAccount)
      ? "admin"
      : mode === "settings"
        ? "settings"
        : isAdminAccount
          ? "admin"
          : "profile";

  const logoutMutation = useLogoutMutation();
  const updateUserProfileMutation = useUpdateUserProfileMutation();
  const updateAvatarMutation = useUpdateUserAvatarMutation();
  const applyForAuthorMutation = useApplyForAuthorMutation();
  const changePasswordMutation = useChangePasswordMutation();
  const updateAdminProfileMutation = useUpdateAdminProfileMutation();
  const deletePostMutation = useDeletePostMutation();

  const userProfileQuery = useUserProfileQuery(resolvedMode !== "admin");

  if (resolvedMode === "admin") {
    return (
      <AdminProfileView
        currentUser={currentUser}
        logoutMutation={logoutMutation}
        updateAdminProfileMutation={updateAdminProfileMutation}
      />
    );
  }

  const handleUpdateProfile = async (data) => {
    return updateUserProfileMutation.mutateAsync(data);
  };

  const handleChangePassword = async (data) => {
    return changePasswordMutation.mutateAsync(data);
  };

  if (resolvedMode === "settings") {
    return (
      <SettingsProfileView
        user={currentUser}
        loading={
          userProfileQuery.isFetching ||
          updateUserProfileMutation.isPending ||
          changePasswordMutation.isPending
        }
        onUpdateProfile={handleUpdateProfile}
        onChangePassword={handleChangePassword}
      />
    );
  }

  return (
    <UserProfileView
      user={currentUser}
      loading={
        userProfileQuery.isFetching ||
        updateAvatarMutation.isPending ||
        applyForAuthorMutation.isPending ||
        logoutMutation.isPending
      }
      navigate={navigate}
      dispatch={dispatch}
      logoutMutation={logoutMutation}
      updateAvatarMutation={updateAvatarMutation}
      applyForAuthorMutation={applyForAuthorMutation}
      deletePostMutation={deletePostMutation}
      onUpdateProfile={handleUpdateProfile}
      updateProfilePending={updateUserProfileMutation.isPending}
      onChangePassword={handleChangePassword}
      changePasswordPending={changePasswordMutation.isPending}
    />
  );
}

export default React.memo(ProfileHub);