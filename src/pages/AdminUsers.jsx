import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { HiCheckBadge, HiOutlineTrash } from "react-icons/hi2";
import { Container } from "../components";
import AdminTable from "../components/Admin/AdminTable";
import { selectAuthUser } from "../features/auth/authSlice";
import { useAdminUsersQuery, useDeleteUserMutation } from "../features/admin/useAdminQueries";
import { hasRole } from "../utils/roleHelpers";
import { isVerifiedAuthor } from "../utils/postHelpers";

const getUserId = (user) => user?._id || user?.id || "";

const getDisplayName = (user) => user?.fullName || user?.username || user?.email || "User";

const getAvatarUrl = (user) => user?.avatar?.url || user?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const getRoleLabel = (user) => {
  const role = String(user?.role || "user").toLowerCase();
  if (role === "superadmin") return "Super Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

function AdminUsers() {
  const navigate = useNavigate();
  const currentUser = useSelector(selectAuthUser);
  const isAdmin = hasRole(currentUser, ["admin", "superadmin"]);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortOption, setSortOption] = useState("createdAt:desc");

  const [sortBy, sortOrder] = sortOption.split(":");

  const usersQuery = useAdminUsersQuery(
    {
      page,
      limit: 12,
      q: searchQuery,
      role: roleFilter,
      sortBy,
      sortOrder,
    },
    isAdmin
  );
  const deleteUserMutation = useDeleteUserMutation();

  const users = useMemo(() => usersQuery.data?.users || [], [usersQuery.data]);
  const pagination = usersQuery.data?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
  const currentUserId = getUserId(currentUser);

  const handleApplySearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleRoleChange = (event) => {
    setPage(1);
    setRoleFilter(event.target.value);
  };

  const handleSortChange = (event) => {
    setPage(1);
    setSortOption(event.target.value);
  };

  const getPageNumbers = () => {
    const totalPages = Number(pagination.totalPages || 1);
    const currentPage = Number(pagination.page || 1);

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, -1, totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
  };

  const handleDelete = async (userId) => {
    if (!userId) return;
    if (!window.confirm("Delete this user permanently? This removes their posts, comments, likes, and follows.")) {
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(userId);
    } catch (error) {
      if (error?.statusCode === 401) {
        navigate("/login");
      }
    }
  };

  const columns = [
    {
      key: "user",
      header: "User",
      render: (user) => {
        const verified = isVerifiedAuthor(user);

        return (
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={getAvatarUrl(user)}
              alt={getDisplayName(user)}
              className="h-11 w-11 rounded-2xl object-cover border border-beige dark:border-light/20 shrink-0"
            />
            <div className="min-w-0">
              <Link
                to={`/admin/users/${user?._id}`}
                className="inline-flex items-center gap-1.5 font-bold text-dark hover:text-primary dark:text-light dark:hover:text-primary max-w-full"
              >
                <span className="truncate">{getDisplayName(user)}</span>
                {verified && (
                  <HiCheckBadge className="h-4 w-4 shrink-0 text-primary" title="Verified author" />
                )}
              </Link>
              <p className="text-xs text-dark/70 dark:text-light/80 truncate">@{user?.username || "unknown"} · {user?.email || "No email"}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "role",
      header: "Role",
      render: (user) => (
        <span className="inline-flex rounded-full bg-background px-3 py-1 text-xs font-bold text-primary dark:bg-background dark:text-primary">
          {getRoleLabel(user)}
        </span>
      ),
    },
    {
      key: "stats",
      header: "Stats",
      render: (user) => (
        <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
          <div className="rounded-xl bg-light px-2 py-2 dark:bg-background">
            <p className="font-black text-dark dark:text-light">{Number(user?.postCount || 0)}</p>
            <p className="text-dark/70 dark:text-light/80">Posts</p>
          </div>
          <div className="rounded-xl bg-light px-2 py-2 dark:bg-background">
            <p className="font-black text-dark dark:text-light">{Number(user?.followerCount || 0)}</p>
            <p className="text-dark/70 dark:text-light/80">Followers</p>
          </div>
          <div className="rounded-xl bg-light px-2 py-2 dark:bg-background">
            <p className="font-black text-dark dark:text-light">{Number(user?.followingCount || 0)}</p>
            <p className="text-dark/70 dark:text-light/80">Following</p>
          </div>
        </div>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      render: (user) =>
        user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-",
    },
    {
      key: "actions",
      header: "Actions",
      render: (user) => {
        const targetRole = String(user?.role || "user").toLowerCase();
        const protectedUser = ["admin", "superadmin"].includes(targetRole) || getUserId(user) === currentUserId;

        return (
          <div className="flex items-center gap-2">
            <Link
              to={`/admin/users/${user?._id}`}
              className="inline-flex items-center rounded-xl border border-beige bg-background px-3 py-2 text-xs font-semibold text-dark hover:bg-light dark:border-light/20 dark:bg-background dark:text-light dark:hover:bg-background"
            >
              View Profile
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(user?._id)}
              disabled={protectedUser || deleteUserMutation.isPending}
              className="inline-flex items-center gap-1 rounded-xl border border-warning/30 bg-light px-3 py-2 text-xs font-semibold text-warning hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 dark:border-warning/40 dark:bg-background dark:text-warning dark:hover:bg-background"
              title={protectedUser ? "Protected account" : "Delete user"}
            >
              <HiOutlineTrash className="h-4 w-4" />
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen pt-28 pb-12 bg-background dark:bg-background">
      <Container>
        <div className="max-w-7xl mx-auto space-y-6">
          <section className="rounded-[1.6rem] border border-beige bg-light p-6 sm:p-8 shadow-[0_24px_60px_-40px_rgba(30,41,59,0.25)] dark:bg-background dark:border-light/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] text-primary">Administration</p>
                <h1 className="mt-2 text-3xl sm:text-4xl font-black text-dark dark:text-light">Users</h1>
                <p className="mt-2 max-w-2xl text-sm sm:text-base text-dark/70 dark:text-light/80">
                  Review all registered accounts, open a user profile, and remove users when moderation requires it.
                </p>
              </div>

              <div className="rounded-2xl border border-beige bg-background px-4 py-3 text-sm font-semibold text-dark dark:border-light/20 dark:bg-background dark:text-light">
                Total users: <span className="text-primary">{pagination.total}</span>
              </div>
            </div>

            <form onSubmit={handleApplySearch} className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name, username, or email"
                className="w-full rounded-xl border border-beige bg-background px-3 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-light/20 dark:bg-background dark:text-light"
              />
              <select
                value={roleFilter}
                onChange={handleRoleChange}
                className="w-full rounded-xl border border-beige bg-background px-3 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-light/20 dark:bg-background dark:text-light"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="author">Author</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
              <select
                value={sortOption}
                onChange={handleSortChange}
                className="w-full rounded-xl border border-beige bg-background px-3 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-light/20 dark:bg-background dark:text-light"
              >
                <option value="createdAt:desc">Newest First</option>
                <option value="createdAt:asc">Oldest First</option>
                <option value="fullName:asc">Name A-Z</option>
                <option value="fullName:desc">Name Z-A</option>
                <option value="username:asc">Username A-Z</option>
                <option value="username:desc">Username Z-A</option>
              </select>
              <button
                type="submit"
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Search
              </button>
            </form>
          </section>

          {usersQuery.error && (
            <p className="rounded-xl border border-warning/30 bg-light px-4 py-3 text-sm font-medium text-warning dark:border-warning/40 dark:bg-background dark:text-warning">
              {usersQuery.error?.message || "Failed to load users"}
            </p>
          )}

          {deleteUserMutation.error && (
            <p className="rounded-xl border border-warning/30 bg-light px-4 py-3 text-sm font-medium text-warning dark:border-warning/40 dark:bg-background dark:text-warning">
              {deleteUserMutation.error?.message || "Failed to delete user"}
            </p>
          )}

          <section className="rounded-[1.6rem] border border-beige bg-light p-5 sm:p-6 shadow-[0_24px_60px_-40px_rgba(30,41,59,0.25)] dark:bg-background dark:border-light/20">
            <AdminTable
              columns={columns}
              rows={users}
              getRowKey={(user) => user?._id}
              emptyMessage={usersQuery.isLoading ? "Loading users..." : "No users found."}
            />

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-dark/70 dark:text-light/80">
                Page {pagination.page} of {pagination.totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={!pagination.hasPreviousPage || usersQuery.isFetching}
                  className="rounded-xl border border-beige bg-background px-4 py-2 text-sm font-semibold text-dark hover:bg-light disabled:cursor-not-allowed disabled:opacity-50 dark:border-light/20 dark:bg-background dark:text-light"
                >
                  Previous
                </button>

                {getPageNumbers().map((pageNumber, index) => {
                  if (pageNumber === -1) {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 text-sm font-semibold text-dark/70 dark:text-light/80"
                      >
                        ...
                      </span>
                    );
                  }

                  const isActive = pageNumber === pagination.page;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      disabled={usersQuery.isFetching}
                      className={
                        isActive
                          ? "rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white"
                            : "rounded-xl border border-beige bg-background px-3 py-2 text-sm font-semibold text-dark hover:bg-light disabled:cursor-not-allowed disabled:opacity-50 dark:border-light/20 dark:bg-background dark:text-light"
                      }
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={!pagination.hasNextPage || usersQuery.isFetching}
                  className="rounded-xl border border-beige bg-background px-4 py-2 text-sm font-semibold text-dark hover:bg-light disabled:cursor-not-allowed disabled:opacity-50 dark:border-light/20 dark:bg-background dark:text-light"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>
      </Container>
    </div>
  );
}

export default React.memo(AdminUsers);