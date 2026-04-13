import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  selectAuthUser,
} from "../features/auth/authSlice";
import { Container } from "../components";
import ProfileDetailsForm from "../components/Profile/ProfileDetailsForm";
import ChangePasswordForm from "../components/Profile/ChangePasswordForm";
import {
  useChangePasswordMutation,
  useUpdateUserProfileMutation,
  useUserProfileQuery,
} from "../features/auth/useAuthQueries";

function ProfileSettings() {
  const user = useSelector(selectAuthUser);
  const userProfileQuery = useUserProfileQuery(true);
  const updateProfileMutation = useUpdateUserProfileMutation();
  const changePasswordMutation = useChangePasswordMutation();
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const loading =
    userProfileQuery.isFetching ||
    updateProfileMutation.isPending ||
    changePasswordMutation.isPending;

  useEffect(() => {
    setError("");
    setMessage("");
  }, []);

  const handleUpdateProfile = async (data) => {
    try {
      setError("");
      const response = await updateProfileMutation.mutateAsync(data);
      setMessage(response?.message || response?.data?.message || "Profile updated successfully");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async (data) => {
    try {
      setError("");
      const response = await changePasswordMutation.mutateAsync(data);
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

export default React.memo(ProfileSettings);
