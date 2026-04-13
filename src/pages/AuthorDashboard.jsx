import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { HiOutlinePencilSquare, HiOutlineShieldExclamation } from "react-icons/hi2";
import { Button, Container } from "../components";
import StatCard from "../components/Admin/StatCard";
import AdminTable from "../components/Admin/AdminTable";
import { selectAuthUser } from "../features/auth/authSlice";
import { useAuthorOverviewQuery } from "../features/author/useAuthorQueries";
import { hasRole } from "../utils/roleHelpers";

const isUserAuthor = (user) => hasRole(user, ["author"]);

function AuthorDashboard({ embedded = false }) {
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);

  const isAuthor = useMemo(() => isUserAuthor(user), [user]);
  const authorOverviewQuery = useAuthorOverviewQuery(isAuthor);

  const loading = authorOverviewQuery.isLoading || authorOverviewQuery.isFetching;
  const error = authorOverviewQuery.error?.message || "";
  const stats = authorOverviewQuery.data?.stats || {};
  const profile = authorOverviewQuery.data?.profile || {};
  const posts = authorOverviewQuery.data?.posts || [];
  const engagement = authorOverviewQuery.data?.engagement || {};
  const recentPosts = authorOverviewQuery.data?.recentPosts || [];

  useEffect(() => {
    if (authorOverviewQuery.error?.statusCode === 401) {
      navigate("/login");
    }
  }, [authorOverviewQuery.error, navigate]);

  const toNumber = (value, fallback = 0) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    if (value && typeof value === "object") {
      const nestedCandidate =
        value.total ??
        value.count ??
        value.value ??
        value.totalPosts ??
        value.publishedPosts ??
        value.draftPosts ??
        value.totalViews;
      const parsed = Number(nestedCandidate);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  };

  const totalPosts = toNumber(stats?.totalPosts ?? stats?.posts, posts.length);
  const publishedPosts = toNumber(stats?.publishedPosts ?? stats?.published, 0);
  const draftPosts = toNumber(
    stats?.draftPosts ?? stats?.drafts,
    Math.max(0, totalPosts - publishedPosts)
  );
  const totalViews = toNumber(stats?.totalViews ?? stats?.views, 0);
  const totalPostLikes = toNumber(
    engagement?.postLikes ?? stats?.postLikes ?? recentPosts.reduce((sum, post) => sum + toNumber(post?.likesCount), 0),
    0
  );

  const metricCards = [
    { label: "Total Posts", value: totalPosts },
    { label: "Published", value: publishedPosts },
    { label: "Drafts", value: draftPosts },
    { label: "Total Views", value: totalViews },
    { label: "Post Likes", value: totalPostLikes },
  ];

  const postColumns = [
    {
      key: "title",
      header: "Title",
      cellClassName: "px-4 py-3 font-semibold text-dark dark:text-light",
      render: (post) => post?.title || "Untitled",
    },
    {
      key: "status",
      header: "Status",
      render: (post) => post?.status || (post?.isPublished ? "published" : "draft"),
    },
    {
      key: "updated",
      header: "Updated",
      render: (post) => {
        const date = post?.updatedAt || post?.createdAt;
        return date ? new Date(date).toLocaleString() : "-";
      },
    },
    {
      key: "likes",
      header: "Likes",
      render: (post) => toNumber(post?.likesCount, 0),
    },
    {
      key: "comments",
      header: "Comments",
      render: (post) => toNumber(post?.commentsCount, 0),
    },
    {
      key: "actions",
      header: "Actions",
      render: (post) => {
        const postId = post?._id || post?.id;
        if (!postId) return "-";

        return (
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => navigate(`/post/${postId}`)}
              bgColor="bg-light dark:bg-background"
              textColor="text-dark dark:text-light"
              className="text-xs font-semibold"
            >
              View
            </Button>
            <Button
              type="button"
              onClick={() => navigate(`/edit-post/${postId}`)}
              bgColor="bg-primary"
              textColor="text-light"
              className="inline-flex items-center gap-1 text-xs font-semibold hover:bg-primary/90"
            >
              <HiOutlinePencilSquare className="h-4 w-4" /> Edit
            </Button>
          </div>
        );
      },
    },
  ];

  if (!isAuthor) {
    if (embedded) return null;

    return (
      <div className="min-h-screen pt-28 pb-12 bg-background dark:bg-background">
        <Container>
          <div className="max-w-3xl mx-auto rounded-3xl border border-warning/25 bg-light p-8 text-center dark:border-warning/35 dark:bg-background">
            <HiOutlineShieldExclamation className="mx-auto h-12 w-12 text-warning" />
            <h1 className="mt-4 text-2xl font-black text-dark dark:text-light">Author Access Required</h1>
            <p className="mt-2 text-sm sm:text-base text-dark/70 dark:text-light/80">
              This page is available only for author accounts.
            </p>
          </div>
        </Container>
      </div>
    );
  }

  const content = (
    <div className="max-w-7xl mx-auto space-y-6">
          <section className="rounded-[1.6rem] border border-beige bg-light shadow-lg dark:bg-background dark:border-light/20 overflow-hidden">
            <div className="px-6 sm:px-8 py-6 sm:py-8 border-b border-beige dark:border-light/20 bg-background dark:bg-background">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] text-primary">Author Center</p>
              <h1 className="mt-2 text-3xl sm:text-4xl font-black text-dark dark:text-light">Content Dashboard</h1>
              <p className="mt-2 text-sm sm:text-base text-dark/70 dark:text-light/80">
                Welcome {profile?.fullName || profile?.name || user?.fullName || "Author"}. Manage your posts and track your publishing progress.
              </p>
            </div>

            <div className="px-6 sm:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {metricCards.map((card) => (
                <StatCard key={card.label} label={card.label} value={card.value} />
              ))}
            </div>
          </section>

          {error && (
            <p className="rounded-xl border border-warning/25 bg-light px-4 py-3 text-sm font-medium text-warning dark:border-warning/35 dark:bg-background dark:text-warning">
              {error}
            </p>
          )}

          <section className="rounded-3xl border border-beige bg-light p-5 sm:p-6 dark:bg-background dark:border-light/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black text-dark dark:text-light">Managed Posts</h2>
              <Button
                type="button"
                onClick={() => navigate("/add-post")}
                bgColor="bg-primary"
                textColor="text-light"
                className="text-sm font-semibold hover:bg-primary/90"
              >
                Create New Post
              </Button>
            </div>

            {loading ? (
              <p className="mt-2 text-sm text-dark/70 dark:text-light/80">Loading managed posts...</p>
            ) : (
              <AdminTable
                columns={postColumns}
                rows={posts}
                getRowKey={(post, index) => post?._id || post?.id || index}
                emptyMessage="No managed posts found yet."
              />
            )}
          </section>
        </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen pt-28 pb-12 bg-background dark:bg-background">
      <Container>{content}</Container>
    </div>
  );
}

export default React.memo(AuthorDashboard);
