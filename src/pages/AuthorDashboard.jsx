import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { HiOutlinePencilSquare, HiOutlineShieldExclamation } from "react-icons/hi2";
import { Button, Container } from "../components";
import AdminTable from "../components/Admin/AdminTable";
import { selectAuthUser } from "../features/auth/authSlice";
import { useAuthorOverviewQuery } from "../features/author/useAuthorQueries";
import { useFollowersListQuery } from "../features/subscription/useSubscriptionQueries";
import { getPostCommentsCount, getPostLikesCount } from "../utils/postHelpers";
import { hasRole } from "../utils/roleHelpers";

const isUserAuthor = (user) => hasRole(user, ["author"]);

function AuthorDashboard({ embedded = false }) {
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);
  const currentAuthorId = user?._id || user?.id || user?.userId || user?.data?._id || null;

  const isAuthor = useMemo(() => isUserAuthor(user), [user]);
  const authorOverviewQuery = useAuthorOverviewQuery(isAuthor);
  const followersQuery = useFollowersListQuery(currentAuthorId, isAuthor && Boolean(currentAuthorId));

  const loading = authorOverviewQuery.isLoading || authorOverviewQuery.isFetching;
  const error = authorOverviewQuery.error?.message || "";
  const stats = authorOverviewQuery.data?.stats || {};
  const profile = authorOverviewQuery.data?.profile || {};
  const posts = useMemo(() => authorOverviewQuery.data?.posts || [], [authorOverviewQuery.data?.posts]);
  const recentPosts = useMemo(() => authorOverviewQuery.data?.recentPosts || [], [authorOverviewQuery.data?.recentPosts]);

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
    stats?.postLikes ?? posts.reduce((sum, post) => sum + toNumber(getPostLikesCount(post), 0), 0),
    0
  );
  const contentPerformance = useMemo(() => {
    const sourcePosts = Array.isArray(posts) && posts.length > 0 ? posts : recentPosts;

    const scoredPosts = sourcePosts
      .map((post) => {
        const likes = toNumber(getPostLikesCount(post), 0);
        const comments = toNumber(getPostCommentsCount(post), 0);
        const score = likes + comments;

        return {
          id: post?._id || post?.id || post?.slug || post?.title || `${likes}-${comments}`,
          title: post?.title || "Untitled",
          likes,
          comments,
          score,
          updatedAt: post?.updatedAt || post?.createdAt || null,
        };
      })
      .sort((left, right) => right.score - left.score);

    const totalLikes = scoredPosts.reduce((sum, item) => sum + item.likes, 0);
    const totalComments = scoredPosts.reduce((sum, item) => sum + item.comments, 0);
    const totalScore = scoredPosts.reduce((sum, item) => sum + item.score, 0);
    const count = scoredPosts.length || 1;

    return {
      topPosts: scoredPosts.slice(0, 3),
      topPost: scoredPosts[0] || null,
      averageLikes: totalLikes / count,
      averageComments: totalComments / count,
      averageScore: totalScore / count,
    };
  }, [posts, recentPosts]);

  const followerBreakdown = useMemo(() => {
    const followers = Array.isArray(followersQuery.data) ? followersQuery.data : [];

    const visibleFollowers = followers.filter((follower) => {
      const role = String(follower?.role || "").toLowerCase();
      return role !== "admin" && role !== "superadmin";
    });

    const authorFollowers = visibleFollowers.filter((follower) => String(follower?.role || "").toLowerCase() === "author");
    const normalFollowers = visibleFollowers.filter((follower) => String(follower?.role || "").toLowerCase() !== "author");

    return {
      total: visibleFollowers.length,
      authors: authorFollowers.length,
      users: normalFollowers.length,
    };
  }, [followersQuery.data]);

  const activityMetrics = [
    { key: "posts", label: "Posts", value: totalPosts, color: "bg-primary" },
    { key: "drafts", label: "Drafts", value: draftPosts, color: "bg-accent" },
    { key: "views", label: "Views", value: totalViews, color: "bg-aqua" },
    { key: "likes", label: "Likes", value: totalPostLikes, color: "bg-warning" },
  ];

  const maxMetricValue = Math.max(
    ...activityMetrics.map((item) => Number(item.value) || 0),
    1
  );

  const followerChartRadius = 44;
  const followerChartCircumference = 2 * Math.PI * followerChartRadius;
  const authorFollowerStroke = followerChartCircumference * (followerBreakdown.total > 0 ? followerBreakdown.authors / followerBreakdown.total : 0);
  const normalFollowerStroke = followerChartCircumference * (followerBreakdown.total > 0 ? followerBreakdown.users / followerBreakdown.total : 0);
  const activityUpdatedAt = new Date().toLocaleTimeString();

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

            <div className="px-6 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-beige bg-background p-4 dark:border-light/20 dark:bg-background">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-dark/70 dark:text-light/80">Content Performance</p>
                  <span className="text-[11px] font-medium text-dark/55 dark:text-light/70">
                    {contentPerformance.topPosts.length} ranked
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-dark/60 dark:text-light/75">
                  Ranked by combined likes and comments so you can quickly spot which posts resonate most.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-beige bg-light/70 p-3 dark:border-light/15 dark:bg-light/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark/55 dark:text-light/65">Avg likes</p>
                    <p className="mt-1 text-2xl font-black text-dark dark:text-light">{Math.round(contentPerformance.averageLikes)}</p>
                  </div>
                  <div className="rounded-xl border border-beige bg-light/70 p-3 dark:border-light/15 dark:bg-light/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark/55 dark:text-light/65">Avg comments</p>
                    <p className="mt-1 text-2xl font-black text-dark dark:text-light">{Math.round(contentPerformance.averageComments)}</p>
                  </div>
                  <div className="rounded-xl border border-beige bg-light/70 p-3 dark:border-light/15 dark:bg-light/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark/55 dark:text-light/65">Avg engagement</p>
                    <p className="mt-1 text-2xl font-black text-dark dark:text-light">{Math.round(contentPerformance.averageScore)}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {contentPerformance.topPosts.length > 0 ? (
                    contentPerformance.topPosts.map((post) => {
                      const maxScore = Math.max(contentPerformance.topPosts[0]?.score || 1, 1);
                      const width = `${Math.max((post.score / maxScore) * 100, 8)}%`;

                      return (
                        <div key={post.id} className="space-y-2 rounded-xl border border-beige bg-light/60 p-3 dark:border-light/15 dark:bg-light/5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-dark dark:text-light">{post.title}</p>
                              <p className="text-[11px] text-dark/55 dark:text-light/65">
                                {post.likes} likes · {post.comments} comments
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary dark:bg-primary/15">
                              {post.score}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-dark/10 dark:bg-light/10">
                            <div className="h-2 rounded-full bg-primary" style={{ width }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-beige bg-light/60 p-4 text-sm text-dark/60 dark:border-light/15 dark:bg-light/5 dark:text-light/70">
                      Publish a few posts to see your top performers here.
                    </div>
                  )}
                </div>

                {contentPerformance.topPost && (
                  <div className="mt-4 rounded-xl border border-accent/20 bg-accent/5 p-3 text-sm text-dark dark:text-light dark:border-accent/30 dark:bg-accent/10">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Best performer</p>
                    <p className="mt-1 font-bold">{contentPerformance.topPost.title}</p>
                    <p className="mt-1 text-xs text-dark/60 dark:text-light/75">
                      {contentPerformance.topPost.score} total engagement points from likes and comments.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-beige bg-background p-4 dark:border-light/20 dark:bg-background">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-dark/70 dark:text-light/80">Activity Overview</p>
                  <span className="text-[11px] font-medium text-dark/55 dark:text-light/70">
                    Updated {activityUpdatedAt}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-5 gap-2 items-end h-36">
                  {activityMetrics.map((item) => {
                    const height = `${Math.max((Number(item.value || 0) / maxMetricValue) * 100, 8)}%`;
                    return (
                      <div key={item.key} className="flex flex-col items-center gap-2 h-full justify-end">
                        <span className="text-[11px] font-bold text-dark/75 dark:text-light/85">
                          {Number(item.value || 0)}
                        </span>
                        <div
                          className={`w-full rounded-md ${item.color}`}
                          style={{ height }}
                          title={`${item.label}: ${item.value}`}
                        />
                        <span className="text-[11px] font-semibold text-dark/70 dark:text-light/80 text-center">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-beige bg-background p-4 dark:border-light/20 dark:bg-background">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-dark/70 dark:text-light/80">Follower Breakdown</p>
                  <span className="text-[11px] font-medium text-dark/55 dark:text-light/70">
                    {followerBreakdown.total}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-center">
                  <svg viewBox="0 0 120 120" className="h-36 w-36" role="img" aria-label="Follower breakdown by author and normal user chart">
                    <circle cx="60" cy="60" r={followerChartRadius} fill="none" stroke="currentColor" className="text-dark/10 dark:text-light/15" strokeWidth="14" />
                    <circle
                      cx="60"
                      cy="60"
                      r={followerChartRadius}
                      fill="none"
                      stroke="currentColor"
                      className="text-primary"
                      strokeWidth="14"
                      strokeDasharray={`${authorFollowerStroke} ${followerChartCircumference}`}
                      transform="rotate(-90 60 60)"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r={followerChartRadius}
                      fill="none"
                      stroke="currentColor"
                      className="text-secondary"
                      strokeWidth="14"
                      strokeDasharray={`${normalFollowerStroke} ${followerChartCircumference}`}
                      strokeDashoffset={-authorFollowerStroke}
                      transform="rotate(-90 60 60)"
                      strokeLinecap="round"
                    />
                    <text
                      x="60"
                      y="54"
                      textAnchor="middle"
                      className="fill-current text-dark dark:text-light"
                      style={{ fontSize: "11px", fontWeight: 700 }}
                    >
                      {followerBreakdown.total}
                    </text>
                    <text
                      x="60"
                      y="68"
                      textAnchor="middle"
                      className="fill-current text-dark/70 dark:text-light/80"
                      style={{ fontSize: "9px", fontWeight: 600 }}
                    >
                      followers
                    </text>
                  </svg>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-dark/70 dark:text-light/80">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    Authors ({followerBreakdown.authors})
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
                    Users ({followerBreakdown.users})
                  </span>
                </div>
              </div>

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
