import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  changeUserPassword,
  getUserProfile,
  logoutUser,
  updateUserAvatar,
  updateUserProfile,
} from "../features/auth/authThunks";
import {
  clearAuthState,
  selectAuthError,
  selectAuthLoading,
  selectAuthMessage,
  selectAuthUser,
} from "../features/auth/authSlice";
import { deletePost, getAllPosts } from "../features/post/postThunks";
import { selectAllPosts } from "../features/post/postSlice";
import { Contaner } from "../components";

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
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectAuthUser);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const message = useSelector(selectAuthMessage);
  const allPosts = useSelector(selectAllPosts);

  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    bio: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    dispatch(getUserProfile());
    dispatch(getAllPosts());

    return () => {
      dispatch(clearAuthState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!user) return;
    setProfileData({
      username: getDisplayName(user),
      email: getUserEmail(user),
      bio: getUserBio(user),
    });
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

  const onChangeProfile = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const onChangePassword = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

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
      await dispatch(updateUserAvatar(formData)).unwrap();
      setAvatarFile(null);
      setAvatarPreview("");
    } catch {
      // error handled by slice/UI
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateUserProfile(profileData)).unwrap();
    } catch {
      // error handled by slice/UI
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert("Please fill all password fields.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    try {
      await dispatch(
        changeUserPassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        })
      ).unwrap();

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      // error handled by slice/UI
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post permanently?")) return;

    try {
      await dispatch(deletePost(postId)).unwrap();
      dispatch(getAllPosts());
    } catch {
      alert("Failed to delete post.");
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate("/login");
    } catch {
      alert("Logout failed. Please try again.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-16 bg-gray-50 dark:bg-slate-900">
        <Contaner>
          <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md border border-gray-100 p-8 text-center dark:bg-slate-800 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Profile not available</h2>
            <p className="text-gray-600 mt-2 dark:text-slate-300">Please login again to view your profile.</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 px-5 py-2.5 rounded-lg bg-primary text-white font-semibold hover:opacity-90"
            >
              Go to Login
            </button>
          </div>
        </Contaner>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-16 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-950">
      <Contaner>
        <div className="max-w-6xl mx-auto space-y-8">
          <section className="rounded-3xl border border-gray-200 bg-white shadow-lg p-6 md:p-8 dark:bg-slate-800 dark:border-slate-700">
            <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="relative">
                  <img
                    src={avatarPreview || getAvatarUrl(user) || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt={getDisplayName(user)}
                    className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-2 border-gray-200 dark:border-slate-600"
                  />
                  <label className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center cursor-pointer border-2 border-white shadow">
                    <input type="file" accept="image/*" className="hidden" onChange={handleSelectAvatar} />
                    <span className="text-sm font-bold">+</span>
                  </label>
                </div>

                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-slate-100">{getDisplayName(user)}</h1>
                  <p className="text-gray-600 mt-1 dark:text-slate-300">{getUserEmail(user)}</p>
                  <p className="text-sm text-gray-500 mt-2 dark:text-slate-400">{getUserBio(user) || "Add a short bio to complete your profile."}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full lg:w-auto">
                <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 text-center min-w-[90px] dark:bg-slate-900 dark:border-slate-700">
                  <p className="text-xl font-black text-gray-900 dark:text-slate-100">{myPosts.length}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Posts</p>
                </div>
                <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 text-center min-w-[90px] dark:bg-slate-900 dark:border-slate-700">
                  <p className="text-xl font-black text-gray-900 dark:text-slate-100">{totalViews}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Views</p>
                </div>
                <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 text-center min-w-[90px] dark:bg-slate-900 dark:border-slate-700">
                  <p className="text-xl font-black text-gray-900 dark:text-slate-100">{totalLikes}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Likes</p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={handleLogout}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-60"
              >
                {loading ? "Please wait..." : "Logout"}
              </button>
            </div>

            {avatarFile && (
              <div className="mt-5 flex gap-3">
                <button
                  onClick={handleUploadAvatar}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? "Uploading..." : "Upload Avatar"}
                </button>
                <button
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview("");
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </section>

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

          <section className="rounded-3xl border border-gray-200 bg-white shadow-md p-6 dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center justify-between gap-3 mb-5">
              <h2 className="text-xl font-black text-gray-900 dark:text-slate-100">My Posts</h2>
              <Link
                to="/add-post"
                className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-semibold hover:opacity-90"
              >
                New Post
              </Link>
            </div>

            {myPosts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-10 px-5 text-center dark:border-slate-600 dark:bg-slate-900">
                <p className="text-gray-700 font-semibold dark:text-slate-200">You have not created any posts yet.</p>
                <p className="text-gray-500 text-sm mt-1 dark:text-slate-400">Start sharing your story now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {myPosts.map((post) => (
                  <div key={post._id} className="rounded-2xl border border-gray-200 overflow-hidden bg-white dark:bg-slate-900 dark:border-slate-700">
                    <img
                      src={post.thumbnail || "https://via.placeholder.com/600x400?text=No+Image"}
                      alt={post.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-gray-900 line-clamp-2 dark:text-slate-100">{post.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Views: {post.views || 0}</p>
                      <div className="flex gap-2 pt-2">
                        <Link
                          to={`/post/${post._id}`}
                          className="flex-1 text-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          View
                        </Link>
                        <Link
                          to={`/edit-post/${post._id}`}
                          className="flex-1 text-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <section className="rounded-3xl border border-gray-200 bg-white shadow-md p-6 dark:bg-slate-800 dark:border-slate-700">
              <h2 className="text-xl font-black text-gray-900 mb-5 dark:text-slate-100">Profile Details</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 dark:text-slate-300">Username</label>
                  <input
                    name="username"
                    type="text"
                    value={profileData.username}
                    onChange={onChangeProfile}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 dark:text-slate-300">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={onChangeProfile}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 dark:text-slate-300">Bio</label>
                  <textarea
                    name="bio"
                    rows={4}
                    value={profileData.bio}
                    onChange={onChangeProfile}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-primary text-white py-2.5 font-semibold hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white shadow-md p-6 dark:bg-slate-800 dark:border-slate-700">
              <h2 className="text-xl font-black text-gray-900 mb-5 dark:text-slate-100">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 dark:text-slate-300">Current Password</label>
                  <input
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={onChangePassword}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 dark:text-slate-300">New Password</label>
                  <input
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={onChangePassword}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 dark:text-slate-300">Confirm New Password</label>
                  <input
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={onChangePassword}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gray-900 text-white py-2.5 font-semibold hover:opacity-90 disabled:opacity-60 dark:bg-slate-700"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </section>
          </div>
        </div>
      </Contaner>
    </div>
  );
}

export default React.memo(Profile);
