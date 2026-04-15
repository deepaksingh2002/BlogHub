import React from "react";
import { Link } from "react-router-dom";

const getDisplayName = (user) => user?.fullName || user?.username || user?.email || "User";
const getAvatarUrl = (user) =>
  user?.avatar?.url || user?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

function AdminUsersPanel({ title = "Users", users = [], loading = false, viewAllTo = "/admin/dashboard#admin-users-section" }) {
  return (
    <article className="rounded-3xl border border-beige bg-light p-5 sm:p-6 dark:bg-background dark:border-light/20">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-dark dark:text-light">{title}</h2>
        <Link
          to={viewAllTo}
          className="text-xs sm:text-sm font-semibold text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-dark/70 dark:text-light/80">Loading {title.toLowerCase()}...</p>
      ) : users.length === 0 ? (
        <p className="mt-4 text-sm text-dark/70 dark:text-light/80">No {title.toLowerCase()} found.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {users.map((user) => (
            <Link
              key={user?._id}
              to={`/admin/users/${user?._id}`}
              className="flex items-center gap-3 rounded-2xl border border-beige bg-background p-3 transition-colors hover:bg-light dark:border-light/20 dark:bg-background dark:hover:bg-background"
            >
              <img
                src={getAvatarUrl(user)}
                alt={getDisplayName(user)}
                className="h-11 w-11 rounded-xl object-cover border border-beige dark:border-light/20 shrink-0"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-dark dark:text-light">{getDisplayName(user)}</p>
                <p className="truncate text-xs text-dark/70 dark:text-light/80">@{user?.username || "unknown"}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

export default React.memo(AdminUsersPanel);