import React, { useEffect, useState } from "react";

function ProfileDetailsForm({ user, loading, onSubmit }) {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    bio: "",
  });

  useEffect(() => {
    if (!user) return;
    setFormData({
      fullName: user?.fullName || user?.name || user?.data?.fullName || "",
      username: user?.username || user?.data?.username || "",
      email: user?.email || user?.data?.email || "",
      bio: user?.bio || user?.about || user?.data?.bio || "",
    });
  }, [user]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <section className="rounded-3xl border border-gray-200 bg-white shadow-md p-6 dark:bg-slate-800 dark:border-slate-700">
      <h2 className="text-xl font-black text-gray-900 mb-5 dark:text-slate-100">Profile Details</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1 dark:text-slate-300">Full name</label>
          <input
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={onChange}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1 dark:text-slate-300">Username</label>
          <input
            name="username"
            type="text"
            value={formData.username}
            onChange={onChange}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1 dark:text-slate-300">Email</label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={onChange}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1 dark:text-slate-300">Bio</label>
          <textarea
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={onChange}
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
  );
}

export default React.memo(ProfileDetailsForm);
