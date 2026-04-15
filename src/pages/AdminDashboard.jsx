import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { HiCheckBadge, HiOutlineShieldCheck, HiOutlineTrash } from "react-icons/hi2";
import { Button, Container } from "../components";
import StatCard from "../components/Admin/StatCard";
import AdminTable from "../components/Admin/AdminTable";
import AuthorApplicationsPanel from "../components/Admin/AuthorApplicationsPanel";
import { selectAuthUser } from "../features/auth/authSlice";
import {
  useAdminOverviewQuery,
  useAdminUsersQuery,
  useApproveAuthorApplicationMutation,
  useDeleteAnyCommentMutation,
  useDeleteAnyPostMutation,
  useDeleteUserMutation,
  useRejectAuthorApplicationMutation,
} from "../features/admin/useAdminQueries";
import { hasRole } from "../utils/roleHelpers";
import { isVerifiedAuthor } from "../utils/postHelpers";

const isUserAdmin = (user) => hasRole(user, ["admin", "superadmin"]);
const getUserId = (user) => user?._id || user?.id || "";
const getDisplayName = (user) => user?.fullName || user?.username || user?.email || "User";
const getAvatarUrl = (user) => user?.avatar?.url || user?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
const getRoleLabel = (user) => {
  const role = String(user?.role || "user").toLowerCase();
  if (role === "superadmin") return "Super Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectAuthUser);

  const isAdmin = useMemo(() => isUserAdmin(user), [user]);

  const adminOverviewQuery = useAdminOverviewQuery(isAdmin);
  const approveMutation = useApproveAuthorApplicationMutation();
  const rejectMutation = useRejectAuthorApplicationMutation();
  const deletePostMutation = useDeleteAnyPostMutation();
  const deleteCommentMutation = useDeleteAnyCommentMutation();
  const deleteUserMutation = useDeleteUserMutation();

  const loading = adminOverviewQuery.isLoading || adminOverviewQuery.isFetching;
  const error = adminOverviewQuery.error?.message || "";
  const stats = adminOverviewQuery.data?.stats || {};
  const profile = adminOverviewQuery.data?.profile || {};
  const applications = adminOverviewQuery.data?.applications || [];
  const logs = adminOverviewQuery.data?.logs || [];
  const reports = adminOverviewQuery.data?.reports || [];
  const actionError =
    approveMutation.error?.message ||
    rejectMutation.error?.message ||
    deletePostMutation.error?.message ||
    deleteCommentMutation.error?.message ||
    deleteUserMutation.error?.message ||
    "";
  const actionMessage = "";

  const [rejectReasonByUser, setRejectReasonByUser] = useState({});
  const [processingUserId, setProcessingUserId] = useState("");
  const [activeControllerTab, setActiveControllerTab] = useState("all");

  const [postIdToDelete, setPostIdToDelete] = useState("");
  const [commentIdToDelete, setCommentIdToDelete] = useState("");
  const [userIdToDelete, setUserIdToDelete] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearchInput, setUsersSearchInput] = useState("");
  const [usersSearchQuery, setUsersSearchQuery] = useState("");
  const [usersRoleFilter, setUsersRoleFilter] = useState("");
  const [usersSortOption, setUsersSortOption] = useState("createdAt:desc");
  const [activeControllerModal, setActiveControllerModal] = useState(null);

  const openControllerModal = (controller) => setActiveControllerModal(controller);
  const closeControllerModal = () => setActiveControllerModal(null);

  const [usersSortBy, usersSortOrder] = usersSortOption.split(":");

  const usersQuery = useAdminUsersQuery(
    {
      page: usersPage,
      limit: 12,
      q: usersSearchQuery,
      role: usersRoleFilter,
      sortBy: usersSortBy,
      sortOrder: usersSortOrder,
    },
    isAdmin
  );

  const users = useMemo(() => usersQuery.data?.users || [], [usersQuery.data]);
  const usersPagination = usersQuery.data?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
  const currentUserId = getUserId(user);

  useEffect(() => {
    if (adminOverviewQuery.error?.statusCode === 401) {
      navigate("/login");
    }
  }, [adminOverviewQuery.error, navigate]);

  useEffect(() => {
    if (location.hash === "#admin-users-section") {
      setActiveControllerModal("users");
    }
  }, [location.hash]);

  const handleApprove = async (userId) => {
    setProcessingUserId(userId);
    try {
      await approveMutation.mutateAsync(userId);
    } catch (err) {
      if (err?.statusCode === 401) navigate("/login");
    } finally {
      setProcessingUserId("");
    }
  };

  const handleReject = async (userId) => {
    const reason = (rejectReasonByUser[userId] || "").trim();
    if (!reason) {
      return;
    }

    setProcessingUserId(userId);
    try {
      await rejectMutation.mutateAsync({ userId, reason });
      setRejectReasonByUser((prev) => ({ ...prev, [userId]: "" }));
    } catch (err) {
      if (err?.statusCode === 401) navigate("/login");
    } finally {
      setProcessingUserId("");
    }
  };

  const handleDeletePost = async () => {
    const postId = postIdToDelete.trim();
    if (!postId) return;

    try {
      await deletePostMutation.mutateAsync(postId);
      setPostIdToDelete("");
    } catch (err) {
      if (err?.statusCode === 401) navigate("/login");
    }
  };

  const handleDeleteComment = async () => {
    const commentId = commentIdToDelete.trim();
    if (!commentId) return;

    try {
      await deleteCommentMutation.mutateAsync(commentId);
      setCommentIdToDelete("");
    } catch (err) {
      if (err?.statusCode === 401) navigate("/login");
    }
  };

  const handleDeleteUser = async () => {
    const userId = userIdToDelete.trim();
    if (!userId) return;

    if (!window.confirm("Delete this user account permanently?")) return;

    try {
      await deleteUserMutation.mutateAsync(userId);
      setUserIdToDelete("");
    } catch (err) {
      if (err?.statusCode === 401) navigate("/login");
    }
  };

  const handleApplyUsersSearch = (event) => {
    event.preventDefault();
    setUsersPage(1);
    setUsersSearchQuery(usersSearchInput.trim());
  };

  const handleUsersRoleChange = (event) => {
    setUsersPage(1);
    setUsersRoleFilter(event.target.value);
  };

  const handleUsersSortChange = (event) => {
    setUsersPage(1);
    setUsersSortOption(event.target.value);
  };

  const handleDeleteFromTable = async (targetUserId) => {
    if (!targetUserId) return;
    if (!window.confirm("Delete this user permanently? This removes their posts, comments, likes, and follows.")) {
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(targetUserId);
    } catch (err) {
      if (err?.statusCode === 401) {
        navigate("/login");
      }
    }
  };

  const getUsersPageNumbers = () => {
    const totalPages = Number(usersPagination.totalPages || 1);
    const currentPage = Number(usersPagination.page || 1);

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

  const handleUseReportedId = (reportItem) => {
    if (!reportItem) return;

    if (reportItem.targetType === "post") {
      setPostIdToDelete(String(reportItem.targetId || ""));
      return;
    }

    if (reportItem.targetType === "comment") {
      setCommentIdToDelete(String(reportItem.targetId || ""));
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-28 pb-12 bg-background dark:bg-background">
        <Container>
          <div className="max-w-3xl mx-auto rounded-3xl border border-warning/30 bg-light p-8 text-center dark:border-warning/40 dark:bg-background">
            <HiOutlineShieldCheck className="mx-auto h-12 w-12 text-warning" />
            <h1 className="mt-4 text-2xl font-black text-dark dark:text-light">Admin Access Required</h1>
            <p className="mt-2 text-sm sm:text-base text-dark/70 dark:text-light/80">
              This dashboard is available only for administrator accounts.
            </p>
          </div>
        </Container>
      </div>
    );
  }

  const getNumericValue = (value) => {
    if (typeof value === "number") return value;
    if (typeof value === "object" && value !== null) {
      return value?.total ?? value?.count ?? 0;
    }
    return 0;
  };

  const metricCards = [
    {
      label: "Total Users",
      value: getNumericValue(stats?.totalUsers ?? stats?.users),
      description: "Registered accounts across the platform.",
    },
    {
      label: "Total Posts",
      value: getNumericValue(stats?.totalPosts ?? stats?.posts),
      description: "Published and draft posts combined.",
    },
    {
      label: "Total Comments",
      value: getNumericValue(stats?.totalComments ?? stats?.comments),
      description: "Conversation activity under posts.",
    },
    {
      label: "Pending Applications",
      value: getNumericValue(stats?.pendingAuthorApplications) ?? applications.length ?? 0,
      description: "Author requests waiting for review.",
    },
  ];

  const logColumns = [
    {
      key: "action",
      header: "Action",
      cellClassName: "px-4 py-3 font-semibold text-dark dark:text-light",
      render: (log) => log?.action || log?.type || "-",
    },
    {
      key: "target",
      header: "Target",
      cellClassName: "px-4 py-3 text-dark/80 dark:text-light/80 break-all",
      render: (log) => log?.targetId || log?.target || log?.entityId || "-",
    },
    {
      key: "actor",
      header: "Actor",
      render: (log) => log?.actor?.fullName || log?.actor?.email || log?.admin?.email || "-",
    },
    {
      key: "time",
      header: "Time",
      render: (log) => {
        const timestamp = log?.createdAt || log?.timestamp || log?.time;
        return timestamp ? new Date(timestamp).toLocaleString() : "-";
      },
    },
  ];

  const usersColumns = [
    {
      key: "user",
      header: "User",
      render: (tableUser) => {
        const verified = isVerifiedAuthor(tableUser);

        return (
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={getAvatarUrl(tableUser)}
              alt={getDisplayName(tableUser)}
              className="h-11 w-11 rounded-2xl object-cover border border-beige dark:border-light/20 shrink-0"
            />
            <div className="min-w-0">
              <Link
                to={`/admin/users/${tableUser?._id}`}
                className="inline-flex items-center gap-1.5 font-bold text-dark hover:text-primary dark:text-light dark:hover:text-primary max-w-full"
              >
                <span className="truncate">{getDisplayName(tableUser)}</span>
                {verified && (
                  <HiCheckBadge className="h-4 w-4 shrink-0 text-primary" title="Verified author" />
                )}
              </Link>
              <p className="text-xs text-dark/70 dark:text-light/80 truncate">@{tableUser?.username || "unknown"} · {tableUser?.email || "No email"}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "role",
      header: "Role",
      render: (tableUser) => (
        <span className="inline-flex rounded-full bg-background px-3 py-1 text-xs font-bold text-primary dark:bg-background dark:text-primary">
          {getRoleLabel(tableUser)}
        </span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      render: (tableUser) =>
        tableUser?.createdAt ? new Date(tableUser.createdAt).toLocaleDateString() : "-",
    },
    {
      key: "actions",
      header: "Actions",
      render: (tableUser) => {
        const targetRole = String(tableUser?.role || "user").toLowerCase();
        const protectedUser = ["admin", "superadmin"].includes(targetRole) || getUserId(tableUser) === currentUserId;

        return (
          <div className="flex items-center gap-2">
            <Link
              to={`/admin/users/${tableUser?._id}`}
              className="inline-flex items-center rounded-xl border border-beige bg-background px-3 py-2 text-xs font-semibold text-dark hover:bg-light dark:border-light/20 dark:bg-background dark:text-light dark:hover:bg-background"
            >
              View Profile
            </Link>
            <button
              type="button"
              onClick={() => handleDeleteFromTable(tableUser?._id)}
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

  const controllerCards = [
    {
      title: "Dashboard",
      category: "overview",
      badge: "Overview",
      note: "Monitor platform health and activity at a glance.",
      actionLabel: "Open Overview",
      action: () => openControllerModal("overview"),
    },
    {
      title: "Profile",
      category: "overview",
      badge: "Account",
      note: "Open your admin profile page when you need to update details.",
      actionLabel: "Open Profile",
      action: () => navigate("/admin/profile"),
    },
    {
      title: "Users",
      category: "users",
      badge: "People",
      note: "Search, review, and moderate user accounts.",
      actionLabel: "Manage Users",
      action: () => openControllerModal("users"),
    },
    {
      title: "Moderation Logs",
      category: "logs",
      badge: "Audit",
      note: "Review recent moderation actions and system changes.",
      actionLabel: "View Logs",
      action: () => openControllerModal("logs"),
    },
    {
      title: "Reports",
      category: "moderation",
      badge: "Moderation",
      note: "Handle flagged content and user reports quickly.",
      actionLabel: "Open Moderation",
      action: () => openControllerModal("moderation"),
    },
    {
      title: "Author Applications",
      category: "applications",
      badge: "Review",
      note: "Approve or reject author requests from one place.",
      actionLabel: "Review Applications",
      action: () => openControllerModal("applications"),
    },
  ];

  const controllerTabs = [
    { key: "all", label: "All" },
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users" },
    { key: "moderation", label: "Moderation" },
    { key: "applications", label: "Applications" },
    { key: "logs", label: "Logs" },
  ];

  const filteredControllerCards = useMemo(() => {
    if (activeControllerTab === "all") return controllerCards;
    return controllerCards.filter((card) => card.category === activeControllerTab);
  }, [activeControllerTab]);

  const getControllerModalTitle = (controller) => {
    const titles = {
      overview: "Dashboard Overview",
      profile: "Admin Profile",
      users: "Users Management",
      applications: "Author Applications",
      moderation: "Moderation Center",
      logs: "Recent Moderation Logs",
    };

    return titles[controller] || "Admin Controller";
  };

  const getControllerModalSizeClass = (controller) => {
    if (controller === "overview") return "max-w-5xl";
    if (controller === "applications") return "max-w-5xl";
    if (controller === "moderation") return "max-w-4xl";
    if (controller === "users" || controller === "logs") return "max-w-6xl";
    return "max-w-5xl";
  };

  const renderControllerModalContent = () => {
    if (activeControllerModal === "overview") {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {metricCards.map((card) => (
              <StatCard key={card.label} label={card.label} value={card.value} description={card.description} />
            ))}
          </div>
        </div>
      );
    }

    if (activeControllerModal === "profile") {
      return (
        <div className="space-y-5">
          <article className="rounded-2xl border border-beige bg-background p-4 sm:p-5 dark:border-light/20 dark:bg-background">
            <p className="text-xs uppercase tracking-[0.16em] text-primary">Administrator</p>
            <h3 className="mt-2 text-xl font-black text-dark dark:text-light">{profile?.fullName || user?.fullName || "Admin"}</h3>
            <p className="mt-1 text-sm text-dark/70 dark:text-light/80">
              {profile?.email || user?.email || "No email available"}
            </p>
            <Link
              to="/admin/profile"
              onClick={closeControllerModal}
              className="mt-4 inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Open Full Profile
            </Link>
          </article>
        </div>
      );
    }

    if (activeControllerModal === "applications") {
      return (
        <AuthorApplicationsPanel
          loading={loading}
          applications={applications}
          processingUserId={processingUserId}
          rejectReasonByUser={rejectReasonByUser}
          setRejectReasonByUser={setRejectReasonByUser}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      );
    }

    if (activeControllerModal === "moderation") {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-beige bg-background p-3.5 dark:border-light/20 dark:bg-background">
            <h3 className="text-sm font-bold text-dark dark:text-light">Reported Items</h3>
            {reports.length === 0 ? (
              <p className="mt-2 text-xs text-dark/70 dark:text-light/80">No open reports right now.</p>
            ) : (
              <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
                {reports.map((report) => (
                  <div
                    key={report?._id || `${report?.targetType}-${report?.targetId}`}
                    className="rounded-xl border border-beige/70 bg-light p-2.5 dark:border-light/20 dark:bg-background"
                  >
                    <p className="text-xs font-semibold text-dark dark:text-light">
                      {String(report?.targetType || "item").toUpperCase()} ID: {report?.targetId}
                    </p>
                    <p className="mt-1 text-[11px] text-dark/70 dark:text-light/80 line-clamp-2">
                      Reporter: {report?.reporter?.fullName || report?.reporter?.username || report?.reporter?.email || "Unknown"}
                    </p>
                    {report?.reason ? (
                      <p className="mt-1 text-[11px] text-dark/65 dark:text-light/75 line-clamp-2">
                        Reason: {report.reason}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleUseReportedId(report)}
                      className="mt-2 h-7 px-2.5 rounded-lg bg-primary text-white text-[11px] font-semibold hover:opacity-90"
                    >
                      Use This ID
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.12em] text-dark/70 dark:text-light/80">Delete Post By ID</label>
            <div className="mt-2 flex gap-2">
              <input
                value={postIdToDelete}
                onChange={(event) => setPostIdToDelete(event.target.value)}
                placeholder="Post ID"
                className="flex-1 rounded-xl border border-beige bg-background px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-light/20 dark:bg-background dark:text-light"
              />
              <Button
                type="button"
                onClick={handleDeletePost}
                bgColor="bg-warning"
                textColor="text-white"
                className="inline-flex items-center gap-1 rounded-xl hover:bg-warning/90 text-xs sm:text-sm font-semibold"
              >
                <HiOutlineTrash className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.12em] text-dark/70 dark:text-light/80">Delete Comment By ID</label>
            <div className="mt-2 flex gap-2">
              <input
                value={commentIdToDelete}
                onChange={(event) => setCommentIdToDelete(event.target.value)}
                placeholder="Comment ID"
                className="flex-1 rounded-xl border border-beige bg-background px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-light/20 dark:bg-background dark:text-light"
              />
              <Button
                type="button"
                onClick={handleDeleteComment}
                bgColor="bg-warning"
                textColor="text-white"
                className="inline-flex items-center gap-1 rounded-xl hover:bg-warning/90 text-xs sm:text-sm font-semibold"
              >
                <HiOutlineTrash className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.12em] text-dark/70 dark:text-light/80">Delete User By ID</label>
            <div className="mt-2 flex gap-2">
              <input
                value={userIdToDelete}
                onChange={(event) => setUserIdToDelete(event.target.value)}
                placeholder="User ID"
                className="flex-1 rounded-xl border border-beige bg-background px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-light/20 dark:bg-background dark:text-light"
              />
              <Button
                type="button"
                onClick={handleDeleteUser}
                bgColor="bg-warning"
                textColor="text-white"
                className="inline-flex items-center gap-1 rounded-xl hover:bg-warning/90 text-xs sm:text-sm font-semibold"
              >
                <HiOutlineTrash className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (activeControllerModal === "logs") {
      return loading ? (
        <p className="text-sm text-dark/70 dark:text-light/80">Loading logs...</p>
      ) : (
        <AdminTable
          columns={logColumns}
          rows={logs}
          getRowKey={(log, index) => log?._id || log?.id || index}
          emptyMessage="No moderation logs found."
        />
      );
    }

    if (activeControllerModal === "users") {
      return (
        <div id="admin-users-section">
          <p className="text-sm text-dark/70 dark:text-light/80">
            Review registered users, open profiles, and moderate accounts directly from dashboard.
          </p>

          <div className="mt-4 rounded-2xl border border-beige bg-background px-4 py-3 text-sm font-semibold text-dark dark:border-light/20 dark:bg-background dark:text-light">
            Total users: <span className="text-primary">{usersPagination.total}</span>
          </div>

          <form onSubmit={handleApplyUsersSearch} className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={usersSearchInput}
              onChange={(event) => setUsersSearchInput(event.target.value)}
              placeholder="Search by name, username, or email"
              className="w-full rounded-xl border border-beige bg-background px-3 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-light/20 dark:bg-background dark:text-light"
            />
            <select
              value={usersRoleFilter}
              onChange={handleUsersRoleChange}
              className="w-full rounded-xl border border-beige bg-background px-3 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-light/20 dark:bg-background dark:text-light"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="author">Author</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
            <select
              value={usersSortOption}
              onChange={handleUsersSortChange}
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

          {usersQuery.error && (
            <p className="mt-4 rounded-xl border border-warning/30 bg-light px-4 py-3 text-sm font-medium text-warning dark:border-warning/40 dark:bg-background dark:text-warning">
              {usersQuery.error?.message || "Failed to load users"}
            </p>
          )}

          <AdminTable
            columns={usersColumns}
            rows={users}
            getRowKey={(tableUser) => tableUser?._id}
            emptyMessage={usersQuery.isLoading ? "Loading users..." : "No users found."}
          />

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-dark/70 dark:text-light/80">
              Page {usersPagination.page} of {usersPagination.totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUsersPage((prev) => Math.max(prev - 1, 1))}
                disabled={!usersPagination.hasPreviousPage || usersQuery.isFetching}
                className="rounded-xl border border-beige bg-background px-4 py-2 text-sm font-semibold text-dark hover:bg-light disabled:cursor-not-allowed disabled:opacity-50 dark:border-light/20 dark:bg-background dark:text-light"
              >
                Previous
              </button>

              {getUsersPageNumbers().map((pageNumber, index) => {
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

                const isActive = pageNumber === usersPagination.page;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setUsersPage(pageNumber)}
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
                onClick={() => setUsersPage((prev) => prev + 1)}
                disabled={!usersPagination.hasNextPage || usersQuery.isFetching}
                className="rounded-xl border border-beige bg-background px-4 py-2 text-sm font-semibold text-dark hover:bg-light disabled:cursor-not-allowed disabled:opacity-50 dark:border-light/20 dark:bg-background dark:text-light"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen pt-28 pb-12 bg-background dark:bg-background">
      <Container>
        <div className="max-w-7xl mx-auto space-y-6">

          <section className="rounded-3xl border border-beige bg-light p-5 sm:p-6 dark:bg-background dark:border-light/20">
            <div className="space-y-1 text-center">
              <h2 className="text-xl font-black text-primary dark:text-primary">Admin Controller Center</h2>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {controllerTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveControllerTab(tab.key)}
                  className={`h-9 px-3.5 rounded-xl text-sm font-semibold transition ${
                    activeControllerTab === tab.key
                      ? "bg-primary text-white"
                      : "border border-beige bg-background text-dark hover:bg-light dark:border-light/20 dark:bg-background dark:text-light dark:hover:bg-background"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredControllerCards.map((card) => (
                <article
                  key={card.title}
                  className="group relative overflow-hidden rounded-3xl border border-beige bg-background p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-light/20 dark:bg-background"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent opacity-80" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-dark/55 dark:text-light/65">
                        {card.badge}
                      </p>
                      <h3 className="mt-2 text-lg font-black text-dark dark:text-light">{card.title}</h3>
                    </div>
                    <span className="shrink-0 rounded-full border border-beige bg-light px-2.5 py-1 text-[11px] font-semibold text-dark/70 dark:border-light/20 dark:bg-background dark:text-light/80">
                      {card.category}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-dark/70 dark:text-light/80">{card.note}</p>
                  <button
                    type="button"
                    onClick={card.action}
                    className="mt-5 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    {card.actionLabel}
                  </button>
                </article>
              ))}
            </div>
          </section>

          {activeControllerModal && (
            <div className="fixed inset-0 z-120 grid place-items-center bg-dark/65 p-4" role="dialog" aria-modal="true">
              <div
                className={`w-full ${getControllerModalSizeClass(activeControllerModal)} max-h-[90vh] overflow-y-auto rounded-3xl border border-beige bg-light p-5 sm:p-6 shadow-2xl dark:border-light/20 dark:bg-background`}
              >
                <div className="relative flex items-center justify-center">
                  <h2 className="text-center text-xl sm:text-2xl font-black text-dark dark:text-light">
                    {getControllerModalTitle(activeControllerModal)}
                  </h2>
                  <button
                    type="button"
                    onClick={closeControllerModal}
                    className="absolute right-0 rounded-lg border border-beige px-3 py-1.5 text-sm font-semibold text-dark hover:bg-background dark:border-light/20 dark:text-light dark:hover:bg-background"
                  >
                    Close
                  </button>
                </div>

                {(error || actionError || actionMessage) && (
                  <div className="mt-4 space-y-3">
                    {error && (
                      <p className="rounded-xl border border-warning/30 bg-light px-4 py-3 text-sm font-medium text-warning dark:border-warning/40 dark:bg-background dark:text-warning">
                        {error}
                      </p>
                    )}
                    {actionError && (
                      <p className="rounded-xl border border-warning/30 bg-light px-4 py-3 text-sm font-medium text-warning dark:border-warning/40 dark:bg-background dark:text-warning">
                        {actionError}
                      </p>
                    )}
                    {actionMessage && (
                      <p className="rounded-xl border border-secondary/30 bg-light px-4 py-3 text-sm font-medium text-secondary dark:border-secondary/40 dark:bg-background dark:text-secondary">
                        {actionMessage}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4">{renderControllerModalContent()}</div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

export default React.memo(AdminDashboard);
