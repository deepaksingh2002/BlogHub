import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "./adminApi";

const pickArray = (payload, candidates = []) => {
  for (const key of candidates) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const pickStats = (payload) => {
  return (
    payload?.stats ||
    payload?.dashboard ||
    payload?.data?.stats ||
    payload?.data?.dashboard ||
    payload?.data ||
    payload ||
    {}
  );
};

const parseAdminOverview = ({ dashboard, profile, applications, logs }) => ({
  stats: pickStats(dashboard),
  profile: profile?.data || profile?.profile || profile || {},
  applications: pickArray(applications, [
    "applications",
    "authorApplications",
    "pendingApplications",
    "users",
  ]),
  logs: pickArray(logs, ["logs", "moderationLogs", "items"]),
});

const adminKeys = {
  root: ["admin"],
  overview: ["admin", "overview"],
  users: ["admin", "users"],
  userProfile: (userId) => ["admin", "users", userId],
};

export const useAdminOverviewQuery = (enabled = true) => {
  return useQuery({
    queryKey: adminKeys.overview,
    enabled,
    queryFn: async () => {
      const [dashboard, profile, applications, logs] = await Promise.all([
        adminService.getDashboard(),
        adminService.getProfile(),
        adminService.getAuthorApplications(),
        adminService.getModerationLogs(),
      ]);
      return parseAdminOverview({ dashboard, profile, applications, logs });
    },
  });
};

const parseAdminUsers = (response) => {
  const data = response?.data || response || {};
  const users = Array.isArray(data?.users)
    ? data.users
    : Array.isArray(data)
      ? data
      : [];

  return {
    users,
    pagination: {
      page: Number(data?.pagination?.page || 1),
      limit: Number(data?.pagination?.limit || 12),
      total: Number(data?.pagination?.total || users.length),
      totalPages: Number(data?.pagination?.totalPages || 1),
      hasNextPage: Boolean(data?.pagination?.hasNextPage),
      hasPreviousPage: Boolean(data?.pagination?.hasPreviousPage),
    },
    filters: {
      q: data?.filters?.q || "",
      role: data?.filters?.role || null,
      sortBy: data?.filters?.sortBy || "createdAt",
      sortOrder: data?.filters?.sortOrder || "desc",
    },
  };
};

export const useAdminUsersQuery = ({
  page = 1,
  limit = 12,
  q = "",
  role = "",
  sortBy = "createdAt",
  sortOrder = "desc",
} = {}, enabled = true) => {
  return useQuery({
    queryKey: [...adminKeys.users, { page, limit, q, role, sortBy, sortOrder }],
    enabled,
    queryFn: async () => {
      const response = await adminService.getUsers({ page, limit, q, role, sortBy, sortOrder });
      return parseAdminUsers(response);
    },
  });
};

export const useAdminUserProfileQuery = (userId, enabled = true) => {
  return useQuery({
    queryKey: adminKeys.userProfile(userId),
    enabled: Boolean(enabled && userId),
    queryFn: async () => {
      const response = await adminService.getUserProfile(userId);
      return response?.data || response || {};
    },
  });
};

const useAdminMutation = (mutationFn) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.root });
    },
  });
};

export const useApproveAuthorApplicationMutation = () =>
  useAdminMutation(async (userId) => adminService.approveAuthorApplication(userId));

export const useRejectAuthorApplicationMutation = () =>
  useAdminMutation(async ({ userId, reason }) =>
    adminService.rejectAuthorApplication(userId, reason)
  );

export const useDeleteAnyPostMutation = () =>
  useAdminMutation(async (postId) => adminService.deleteAnyPost(postId));

export const useDeleteAnyCommentMutation = () =>
  useAdminMutation(async (commentId) => adminService.deleteAnyComment(commentId));

export const useDeleteUserMutation = () =>
  useAdminMutation(async (userId) => adminService.deleteUser(userId));
