import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { HiOutlineShieldCheck, HiOutlineTrash, HiOutlineUsers } from "react-icons/hi2";
import { Button, Container } from "../components";
import StatCard from "../components/Admin/StatCard";
import AdminTable from "../components/Admin/AdminTable";
import AuthorApplicationsPanel from "../components/Admin/AuthorApplicationsPanel";
import { selectAuthUser } from "../features/auth/authSlice";
import {
  useAdminOverviewQuery,
  useApproveAuthorApplicationMutation,
  useDeleteAnyCommentMutation,
  useDeleteAnyPostMutation,
  useRejectAuthorApplicationMutation,
} from "../features/admin/useAdminQueries";
import { hasRole } from "../utils/roleHelpers";

const isUserAdmin = (user) => hasRole(user, ["admin", "superadmin"]);

function AdminDashboard() {
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);

  const isAdmin = useMemo(() => isUserAdmin(user), [user]);

  const adminOverviewQuery = useAdminOverviewQuery(isAdmin);
  const approveMutation = useApproveAuthorApplicationMutation();
  const rejectMutation = useRejectAuthorApplicationMutation();
  const deletePostMutation = useDeleteAnyPostMutation();
  const deleteCommentMutation = useDeleteAnyCommentMutation();

  const loading = adminOverviewQuery.isLoading || adminOverviewQuery.isFetching;
  const error = adminOverviewQuery.error?.message || "";
  const stats = adminOverviewQuery.data?.stats || {};
  const profile = adminOverviewQuery.data?.profile || {};
  const applications = adminOverviewQuery.data?.applications || [];
  const logs = adminOverviewQuery.data?.logs || [];
  const actionError =
    approveMutation.error?.message ||
    rejectMutation.error?.message ||
    deletePostMutation.error?.message ||
    deleteCommentMutation.error?.message ||
    "";
  const actionMessage = "";

  const [rejectReasonByUser, setRejectReasonByUser] = useState({});
  const [processingUserId, setProcessingUserId] = useState("");

  const [postIdToDelete, setPostIdToDelete] = useState("");
  const [commentIdToDelete, setCommentIdToDelete] = useState("");

  useEffect(() => {
    if (adminOverviewQuery.error?.statusCode === 401) {
      navigate("/login");
    }
  }, [adminOverviewQuery.error, navigate]);

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
    { label: "Total Users", value: getNumericValue(stats?.totalUsers ?? stats?.users) },
    { label: "Total Posts", value: getNumericValue(stats?.totalPosts ?? stats?.posts) },
    { label: "Total Comments", value: getNumericValue(stats?.totalComments ?? stats?.comments) },
    { label: "Pending Applications", value: getNumericValue(stats?.pendingAuthorApplications) ?? applications.length ?? 0 },
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

  return (
    <div className="min-h-screen pt-28 pb-12 bg-background dark:bg-background">
      <Container>
        <div className="max-w-7xl mx-auto space-y-6">
          <section className="rounded-[1.6rem] border border-beige bg-light shadow-[0_24px_60px_-40px_rgba(30,41,59,0.25)] dark:bg-background dark:border-light/20 overflow-hidden">
            <div className="px-6 sm:px-8 py-6 sm:py-8 border-b border-beige dark:border-light/20 bg-background dark:bg-background">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] text-primary">Administration</p>
              <h1 className="mt-2 text-3xl sm:text-4xl font-black text-dark dark:text-light">Control Dashboard</h1>
              <p className="mt-2 text-sm sm:text-base text-dark/70 dark:text-light/80">
                Welcome {profile?.fullName || profile?.name || user?.fullName || "Admin"}. Review applications, moderation logs, and perform moderation actions.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/admin/users"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                >
                  <HiOutlineUsers className="h-4 w-4" />
                  Users
                </Link>
                <Link
                  to="/admin/profile"
                  className="inline-flex items-center rounded-xl border border-beige bg-background px-4 py-2 text-sm font-semibold text-dark hover:bg-light dark:border-light/20 dark:bg-background dark:text-light dark:hover:bg-background"
                >
                  Admin Profile
                </Link>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {metricCards.map((card) => (
                <StatCard key={card.label} label={card.label} value={card.value} />
              ))}
            </div>
          </section>

          {(error || actionError || actionMessage) && (
            <section className="space-y-3">
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
            </section>
          )}

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AuthorApplicationsPanel
              loading={loading}
              applications={applications}
              processingUserId={processingUserId}
              rejectReasonByUser={rejectReasonByUser}
              setRejectReasonByUser={setRejectReasonByUser}
              onApprove={handleApprove}
              onReject={handleReject}
            />

            <article className="rounded-3xl border border-beige bg-light p-5 sm:p-6 dark:bg-background dark:border-light/20">
              <h2 className="text-xl font-black text-dark dark:text-light">Moderation Quick Actions</h2>
              <p className="mt-1 text-sm text-dark/70 dark:text-light/80">Use object IDs to delete problematic records.</p>

              <Link
                to="/admin/users"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
              >
                <HiOutlineUsers className="h-4 w-4" />
                Manage Users
              </Link>

              <div className="mt-5 space-y-4">
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
              </div>
            </article>
          </section>

          <section className="rounded-3xl border border-beige bg-light p-5 sm:p-6 dark:bg-background dark:border-light/20">
            <h2 className="text-xl font-black text-dark dark:text-light">Recent Moderation Logs</h2>
            {loading ? (
              <p className="mt-2 text-sm text-dark/70 dark:text-light/80">Loading logs...</p>
            ) : (
              <AdminTable
                columns={logColumns}
                rows={logs}
                getRowKey={(log, index) => log?._id || log?.id || index}
                emptyMessage="No moderation logs found."
              />
            )}
          </section>
        </div>
      </Container>
    </div>
  );
}

export default React.memo(AdminDashboard);
