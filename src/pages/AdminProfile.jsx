import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { HiOutlineShieldCheck } from "react-icons/hi2";
import { Container } from "../components";
import AdminUsersPanel from "../components/Admin/AdminUsersPanel";
import { clearAuthSession, selectAuthUser } from "../features/auth/authSlice";
import { clearStoredAuthTokens, getStoredRefreshToken } from "../features/auth/authSession";
import { useLogoutMutation } from "../features/auth/useAuthQueries";
import {
  useAdminOverviewQuery,
  useAdminUsersQuery,
  useUpdateAdminProfileMutation,
} from "../features/admin/useAdminQueries";
import { hasRole } from "../utils/roleHelpers";

function AdminProfile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectAuthUser);
  const isAdmin = useMemo(() => hasRole(currentUser, ["admin", "superadmin"]), [currentUser]);
  const logoutMutation = useLogoutMutation();
  const updateAdminProfileMutation = useUpdateAdminProfileMutation();
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileForm, setProfileForm] = useState({ fullName: "", bio: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

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
  const stats = overviewQuery.data?.stats || {};
  const profileAvatar = profile?.avatar?.url || profile?.avatar || currentUser?.avatar?.url || currentUser?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

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
    } catch (error) {
      setProfileError(error?.message || "Failed to update profile");
    }
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
    <div className="min-h-screen pt-28 pb-12 bg-background dark:bg-background">
      <Container>
        <div className="max-w-7xl mx-auto space-y-6">
          <section className="rounded-[1.6rem] border border-beige bg-light shadow-[0_24px_60px_-40px_rgba(30,41,59,0.25)] dark:bg-background dark:border-light/20 overflow-hidden">
            <div className="px-6 sm:px-8 py-6 sm:py-8 border-b border-beige dark:border-light/20 bg-background dark:bg-background">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] text-primary">Administration</p>
              <h1 className="mt-2 text-3xl sm:text-4xl font-black text-dark dark:text-light">Admin Profile</h1>
              <p className="mt-2 text-sm sm:text-base text-dark/70 dark:text-light/80">
                Welcome {profile?.fullName || currentUser?.fullName || "Admin"}. Manage platform users and authors from this profile view.
              </p>
            </div>

            <div className="px-6 sm:px-8 py-6 grid grid-cols-1 xl:grid-cols-[auto,1fr] gap-6 items-start">
              <form onSubmit={handleProfileSave} className="rounded-3xl border border-beige bg-background p-5 dark:border-light/20 dark:bg-background space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src={avatarPreview || profileAvatar}
                    alt={profile?.fullName || "Admin"}
                    className="h-20 w-20 rounded-2xl object-cover border border-beige dark:border-light/20"
                  />
                  <div className="space-y-2">
                    <label className="inline-flex cursor-pointer items-center rounded-xl border border-beige bg-light px-4 py-2 text-sm font-semibold text-dark hover:bg-gray-50 dark:border-light/20 dark:bg-background dark:text-light dark:hover:bg-background">
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
                    className="w-full rounded-xl border border-beige bg-light px-4 py-2.5 text-dark outline-none transition focus:border-primary dark:border-light/20 dark:bg-background dark:text-light"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark dark:text-light mb-2">Bio</label>
                  <textarea
                    rows={4}
                    value={profileForm.bio}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, bio: event.target.value }))}
                    className="w-full rounded-xl border border-beige bg-light px-4 py-2.5 text-dark outline-none transition focus:border-primary dark:border-light/20 dark:bg-background dark:text-light"
                  />
                </div>

                {(profileMessage || profileError) && (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm font-medium ${
                      profileError
                        ? "border border-warning/30 bg-warning/10 text-warning"
                        : "border border-secondary/30 bg-secondary/10 text-secondary"
                    }`}
                  >
                    {profileError || profileMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={updateAdminProfileMutation.isPending}
                  className="inline-flex items-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {updateAdminProfileMutation.isPending ? "Saving..." : "Update Profile"}
                </button>
              </form>

              <div className="flex items-center gap-4">
                <img
                  src={profileAvatar}
                  alt={profile?.fullName || "Admin"}
                  className="h-20 w-20 rounded-2xl object-cover border border-beige dark:border-light/20"
                />
                <div>
                  <p className="text-xl font-black text-dark dark:text-light">{profile?.fullName || currentUser?.fullName || "Administrator"}</p>
                  <p className="text-sm text-dark/70 dark:text-light/80">@{profile?.username || currentUser?.username || "admin"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-beige bg-background px-4 py-3 dark:bg-background dark:border-light/20">
                  <p className="text-xs text-dark/70 dark:text-light/80">Users</p>
                  <p className="mt-1 text-2xl font-black text-dark dark:text-light">{Number(stats?.users?.total || 0)}</p>
                </div>
                <div className="rounded-2xl border border-beige bg-background px-4 py-3 dark:bg-background dark:border-light/20">
                  <p className="text-xs text-dark/70 dark:text-light/80">Posts</p>
                  <p className="mt-1 text-2xl font-black text-dark dark:text-light">{Number(stats?.posts?.totalPosts || 0)}</p>
                </div>
                <div className="rounded-2xl border border-beige bg-background px-4 py-3 dark:bg-background dark:border-light/20">
                  <p className="text-xs text-dark/70 dark:text-light/80">Comments</p>
                  <p className="mt-1 text-2xl font-black text-dark dark:text-light">{Number(stats?.engagement?.comments || 0)}</p>
                </div>
                <div className="rounded-2xl border border-beige bg-background px-4 py-3 dark:bg-background dark:border-light/20">
                  <p className="text-xs text-dark/70 dark:text-light/80">Pending Authors</p>
                  <p className="mt-1 text-2xl font-black text-dark dark:text-light">{Number(stats?.users?.pendingAuthorApplications || 0)}</p>
                </div>
              </div>
            </div>

            <div className="px-6 sm:px-8 pb-6 flex flex-wrap gap-3">
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center rounded-xl border border-beige bg-background px-4 py-2 text-sm font-semibold text-dark hover:bg-light dark:border-light/20 dark:bg-background dark:text-light dark:hover:bg-background"
              >
                Open Dashboard
              </Link>
              <Link
                to="/admin/users"
                className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Manage Users
              </Link>
              <button
                type="button"
                onClick={() => navigate("/admin/dashboard")}
                className="inline-flex items-center rounded-xl border border-beige bg-background px-4 py-2 text-sm font-semibold text-dark hover:bg-light dark:border-light/20 dark:bg-background dark:text-light dark:hover:bg-background"
              >
                Go to Moderation
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="inline-flex items-center rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white hover:bg-warning/90 disabled:opacity-60"
              >
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AdminUsersPanel
              title="Recent Users"
              users={usersQuery.data?.users || []}
              loading={usersQuery.isLoading || usersQuery.isFetching}
              viewAllTo="/admin/users"
            />
            <AdminUsersPanel
              title="Recent Authors"
              users={authorsQuery.data?.users || []}
              loading={authorsQuery.isLoading || authorsQuery.isFetching}
              viewAllTo="/admin/users"
            />
          </section>
        </div>
      </Container>
    </div>
  );
}

export default React.memo(AdminProfile);