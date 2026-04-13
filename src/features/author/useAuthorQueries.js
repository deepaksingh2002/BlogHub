import { useQuery } from "@tanstack/react-query";
import { authorService } from "./authorApi";

const pickStats = (payload) => {
  const candidate =
    payload?.stats ||
    payload?.dashboard ||
    payload?.posts ||
    payload?.data?.stats ||
    payload?.data?.dashboard ||
    payload?.data?.posts ||
    payload?.data ||
    payload ||
    {};

  if (candidate && typeof candidate === "object" && candidate.posts && typeof candidate.posts === "object") {
    return candidate.posts;
  }

  return (
    candidate
  );
};

const pickManagedPosts = (payload) => {
  if (Array.isArray(payload?.posts)) return payload.posts;
  if (Array.isArray(payload?.managedPosts)) return payload.managedPosts;
  if (Array.isArray(payload?.data?.posts)) return payload.data.posts;
  if (Array.isArray(payload?.data?.managedPosts)) return payload.data.managedPosts;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const parseAuthorOverview = ({ dashboard, profile, managedPosts }) => ({
  stats: pickStats(dashboard),
  profile: profile?.profile || profile?.data || profile || {},
  posts: pickManagedPosts(managedPosts),
  engagement: dashboard?.engagement || dashboard?.data?.engagement || {},
  recentPosts: dashboard?.recentPosts || dashboard?.data?.recentPosts || [],
});

const authorKeys = {
  overview: ["author", "overview"],
};

export const useAuthorOverviewQuery = (enabled = true) => {
  return useQuery({
    queryKey: authorKeys.overview,
    enabled,
    queryFn: async () => {
      const [dashboard, profile, managedPosts] = await Promise.all([
        authorService.getDashboard(),
        authorService.getProfile(),
        authorService.getManagedPosts(),
      ]);

      return parseAuthorOverview({ dashboard, profile, managedPosts });
    },
  });
};
