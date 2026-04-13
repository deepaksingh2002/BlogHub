import { hasRole } from "./roleHelpers";

export const getUserId = (user) => user?._id || user?.id || user?.userId || null;

export const getUserDisplayName = (user, fallback = "Unknown User") =>
  user?.username || user?.fullName || user?.name || fallback;

export const getPostOwner = (post) => post?.owner || post?.author || post?.user || {};

const normalizeStatus = (status) =>
  String(status || "")
    .trim()
    .toLowerCase();

export const isVerifiedAuthor = (user) => {
  if (!user || typeof user !== "object") return false;

  if (hasRole(user, ["author", "admin", "superadmin"])) {
    return true;
  }

  const status =
    user?.authorApplication?.status ||
    user?.data?.authorApplication?.status ||
    user?.authorStatus ||
    user?.data?.authorStatus;

  return normalizeStatus(status) === "approved";
};

export const resolvePostCategory = (post, fallback = "") => {
  const value =
    post?.category ??
    post?.catagry ??
    post?.catagory ??
    post?.categoryName ??
    post?.postCategory ??
    post?.topic ??
    "";

  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "object" && value) {
    const normalized = value?.name || value?.title || value?.label || value?.value || "";
    if (normalized) return normalized;
  }

  return fallback;
};

export const getPostLikesCount = (post) =>
  post?.likesCount ??
  (Array.isArray(post?.likes) ? post.likes.length : Number(post?.likes) || 0);

export const getPostCommentsCount = (post) =>
  post?.commentsCount ??
  post?.commentCount ??
  (Array.isArray(post?.comments) ? post.comments.length : 0);

export const formatDisplayDate = (date) => {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};
