import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUserProfile, updateUserAvatar } from "../features/auth/authThunks";
import { getAllPosts, deletePost } from "../features/post/postThunks";
import { selectAuthUser } from "../features/auth/authSlice";
import { selectAllPosts } from "../features/post/postSlice";
import { useParams, Link, useNavigate } from "react-router-dom";

function UserProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId } = useParams();

  const currentUser = useSelector(selectAuthUser);
  const allPosts = useSelector(selectAllPosts);

  const isOwner = currentUser?._id === userId;
  const userPosts = allPosts.filter((p) => p.owner === userId);

  const [avatarFile, setAvatarFile] = useState(null);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  useEffect(() => {
    if (!userId) return navigate("/");

    dispatch(getUserProfile(userId));
    dispatch(getAllPosts());
  }, [dispatch, userId, navigate]);

  const handleAvatarChange = (e) => {
    if (!e.target.files?.[0]) return;
    setAvatarFile(e.target.files[0]);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUpdatingAvatar(true);
    await dispatch(updateUserAvatar(avatarFile));
    setAvatarFile(null);
    setUpdatingAvatar(false);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    await dispatch(deletePost(postId)).unwrap();
    dispatch(getAllPosts());
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-20">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
        <div className="relative">
          <img
            src={currentUser?.avatar || "/default-avatar.png"}
            alt={currentUser?.name}
            className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
          />
          {isOwner && (
            <label className="absolute bottom-0 right-0 cursor-pointer bg-white border rounded-full p-1 hover:bg-gray-100 transition">
              <input type="file" className="hidden" onChange={handleAvatarChange} />
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </label>
          )}
          {avatarFile && (
            <button
              onClick={handleAvatarUpload}
              className="absolute bottom-0 left-0 bg-blue-500 px-3 py-1 text-white rounded-full text-sm hover:bg-blue-600 transition"
              disabled={updatingAvatar}
            >
              {updatingAvatar ? "Updating..." : "Save"}
            </button>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-2xl font-semibold">{currentUser?.name}</h1>
            {isOwner && (
              <button className="border px-4 py-1 rounded hover:bg-gray-100 transition">
                Edit Profile
              </button>
            )}
          </div>

          <div className="flex gap-8 mb-4 text-sm font-medium">
            <span>{userPosts.length} posts</span>
            <span>100 followers</span>
            <span>150 following</span>
          </div>

          {currentUser?.bio && (
            <p className="text-gray-700">{currentUser.bio}</p>
          )}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-2">
        {userPosts.map((post) => (
          <div key={post._id} className="relative group overflow-hidden rounded">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-32 md:h-48 object-cover transform group-hover:scale-110 transition duration-300"
            />
            {isOwner && (
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition">
                <Link to={`/edit-post/${post._id}`}>
                  <button className="bg-blue-500 px-3 py-1 text-white rounded hover:bg-blue-600 transition text-sm">
                    Edit
                  </button>
                </Link>
                <button
                  onClick={() => handleDeletePost(post._id)}
                  className="bg-red-500 px-3 py-1 text-white rounded hover:bg-red-600 transition text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserProfile;



// // Replace your Profile.jsx COMPLETELY with this simplified version:
// import React, { useEffect, useState, useRef, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import {
//   updateUserProfile,
//   updateUserAvatar,
//   //changeUserPassword,
//   selectAuthUser,
//   selectAuthLoading,
//   selectAuthError,
//   selectAuthMessage,
//   clearAuthState,
// } from "../features/auth/authSlice";
// import { Contaner } from "../components";

// const Profile = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const fileInputRef = useRef(null);

//   const user = useSelector(selectAuthUser);
//   const loading = useSelector(selectAuthLoading);
//   const error = useSelector(selectAuthError);
//   const message = useSelector(selectAuthMessage);

//   const [editMode, setEditMode] = useState(false);
//   const [profileData, setProfileData] = useState({ username: "", email: "" });
//   const [passwordData, setPasswordData] = useState({
//     currentPassword: "",
//     newPassword: "",
//     confirmPassword: "",
//   });
//   const [avatarPreview, setAvatarPreview] = useState(null);

//   // Sync form with user data
//   useEffect(() => {
//     if (user) {
//       setProfileData({
//         username: user.username || "",
//         email: user.email || "",
//       });
//     }
//   }, [user]);

//   useEffect(() => {
//     return () => dispatch(clearAuthState());
//   }, [dispatch]);

//   const handleAvatarChange = useCallback((e) => {
//     const file = e.target.files[0];
//     if (file && file.type.startsWith("image/") && file.size < 5 * 1024 * 1024) {
//       const reader = new FileReader();
//       reader.onloadend = () => setAvatarPreview(reader.result);
//       reader.readAsDataURL(file);
//       e.target.dataset.file = file;
//     }
//   }, []);

//   const handleUpdateAvatar = async () => {
//     if (!fileInputRef.current?.dataset.file) return alert("Select image first");
    
//     const formData = new FormData();
//     formData.append("avatar", fileInputRef.current.dataset.file);
    
//     await dispatch(updateUserAvatar(formData));
//     setAvatarPreview(null);
//     fileInputRef.current.value = "";
//   };

//   const handleUpdateProfile = async (e) => {
//     e.preventDefault();
//     await dispatch(updateUserProfile(profileData));
//     setEditMode(false);
//   };

//   const handleChangePassword = async (e) => {
//     e.preventDefault();
//     if (passwordData.newPassword !== passwordData.confirmPassword) {
//       return alert("Passwords don't match");
//     }
//     await dispatch(changeUserPassword(passwordData));
//     setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
//   };
// if (loading) {
//   return (
//     <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
//       <LoadingAnimation type="pulse" size="xl" color="secondary" />
//       <LoadingAnimation type="bounce" size="md" />
//       <div className="text-center">
//         <h2 className="text-2xl font-bold text-light mb-2">Loading Profile</h2>
//         <LoadingAnimation type="spinner" size="sm" color="accent" />
//       </div>
//     </div>
//   );
// }
//   if (!user) {
//     return (
//       <div className="text-center py-12">
//         <p>Please log in to view profile</p>
//       </div>
//     );
//   }

//   return (
//     <div className="py-12">
//       <Contaner>
//         <div className="max-w-2xl mx-auto space-y-8">
//           {/* Avatar Upload */}
//           <div className="bg-white p-8 rounded-2xl shadow-lg">
//             <h2 className="text-2xl font-bold mb-6">Profile Picture</h2>
//             <div className="flex flex-col md:flex-row items-center gap-6">
//               <img
//                 src={avatarPreview || user.avatar || "/default-avatar.png"}
//                 alt="Avatar"
//                 className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-200"
//               />
//               <div>
//                 <input
//                   ref={fileInputRef}
//                   type="file"
//                   accept="image/*"
//                   onChange={handleAvatarChange}
//                   className="hidden"
//                 />
//                 <label
//                   htmlFor="avatar"
//                   onClick={() => fileInputRef.current?.click()}
//                   className="block bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600 cursor-pointer mb-2"
//                 >
//                   Choose New Avatar
//                 </label>
//                 {avatarPreview && (
//                   <button
//                     onClick={handleUpdateAvatar}
//                     disabled={loading}
//                     className="bg-green-500 text-white px-6 py-2 rounded-xl hover:bg-green-600 disabled:opacity-50"
//                   >
//                     Upload Avatar
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Profile Edit */}
//           <div className="bg-white p-8 rounded-2xl shadow-lg">
//             <div className="flex justify-between items-center mb-6">
//               <h2 className="text-2xl font-bold">Profile Information</h2>
//               <button
//                 onClick={() => setEditMode(!editMode)}
//                 className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600"
//               >
//                 {editMode ? "Cancel" : "Edit"}
//               </button>
//             </div>

//             {editMode ? (
//               <form onSubmit={handleUpdateProfile} className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-2">Username</label>
//                   <input
//                     type="text"
//                     value={profileData.username}
//                     onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
//                     className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-2">Email</label>
//                   <input
//                     type="email"
//                     value={profileData.email}
//                     onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
//                     className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="w-full bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 disabled:opacity-50 mt-4"
//                 >
//                   Save Changes
//                 </button>
//               </form>
//             ) : (
//               <div className="grid md:grid-cols-2 gap-6">
//                 <div>
//                   <span className="text-sm text-gray-500">Username</span>
//                   <p className="text-xl font-semibold">{profileData.username}</p>
//                 </div>
//                 <div>
//                   <span className="text-sm text-gray-500">Email</span>
//                   <p className="text-xl font-semibold">{profileData.email}</p>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Password Change */}
//           <div className="bg-white p-8 rounded-2xl shadow-lg">
//             <h2 className="text-2xl font-bold mb-6">Change Password</h2>
//             <form onSubmit={handleChangePassword} className="space-y-4">
//               <input
//                 type="password"
//                 placeholder="Current Password"
//                 value={passwordData.currentPassword}
//                 onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
//                 className="w-full p-3 border rounded-lg"
//               />
//               <input
//                 type="password"
//                 placeholder="New Password"
//                 value={passwordData.newPassword}
//                 onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
//                 className="w-full p-3 border rounded-lg"
//               />
//               <input
//                 type="password"
//                 placeholder="Confirm New Password"
//                 value={passwordData.confirmPassword}
//                 onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
//                 className="w-full p-3 border rounded-lg"
//               />
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full bg-purple-500 text-white p-3 rounded-xl hover:bg-purple-600 disabled:opacity-50"
//               >
//                 Update Password
//               </button>
//             </form>
//           </div>

//           {message && (
//             <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded-xl">
//               {message}
//             </div>
//           )}
//           {error && (
//             <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-xl">
//               {error}
//             </div>
//           )}
//         </div>
//       </Contaner>
//     </div>
//   );
// };

// export default React.memo(Profile);
