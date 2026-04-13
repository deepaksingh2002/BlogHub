import React, { memo } from "react";
import { Link } from "react-router-dom";
import {
  HiTag,
  HiEye,
  HiArrowRight,
  HiHeart,
  HiChatBubbleOvalLeft,
} from "react-icons/hi2";
import {
  formatDisplayDate,
  getPostCommentsCount,
  getPostLikesCount,
  getPostOwner,
  getUserDisplayName,
  isVerifiedAuthor,
  resolvePostCategory,
} from "../utils/postHelpers";
import { HiCheckBadge } from "react-icons/hi2";

const PostCard = memo(function PostCard({ post }) {
  if (!post) return null;

  const { title, thumbnail, createdAt, views } = post;
  const postOwner = getPostOwner(post);
  const author = getUserDisplayName(postOwner, "Unknown Author");
  const safeCategory = resolvePostCategory(post);
  const authorAvatar =
    postOwner?.avatar?.url ||
    postOwner?.avatar?.secure_url ||
    postOwner?.avatar ||
    postOwner?.profilePic?.url ||
    postOwner?.profilePic ||
    postOwner?.profileImage ||
    postOwner?.image ||
    postOwner?.avatarUrl ||
    "";

  const likesCount = getPostLikesCount(post);
  const commentsCount = getPostCommentsCount(post);
  const isAuthorVerified = isVerifiedAuthor(postOwner);

  const optimizeImageUrl = (url) => {
    if (!url) return "";
    if (url.includes("cloudinary.com")) {
      const parts = url.split("/upload/");
      if (parts.length === 2) {
        return `${parts[0]}/upload/q_80,w_350,c_fill,ar_16:9/${parts[1]}`;
      }
    }
    return url;
  };

  const truncateText = (text, maxLength = 60) => {
    if (!text) return "Untitled Post";
    return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
  };

  const authorInitial = author?.charAt(0)?.toUpperCase() || "U";

  return (
    <Link
      to={`/post/${post._id}`}
      className="group relative block h-[370px] w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-3xl transition-all duration-500 hover:-translate-y-2 bg-light/95 border border-secondary/20 hover:border-primary/30 shadow-lg hover:shadow-2xl hover:shadow-primary/15"
      aria-label={`Read post: ${title || "Untitled"}`}
    >
      <div className="relative h-[44%] w-full overflow-hidden rounded-t-3xl bg-linear-to-br from-primary/10 to-transparent">
        <img
          src={optimizeImageUrl(thumbnail)}
          alt={title || "Post thumbnail"}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/5 to-transparent" />

        {safeCategory && (
          <div className="absolute top-3 left-3 z-10">
            <div className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-primary bg-white/95 backdrop-blur-sm rounded-full shadow-md transition-all duration-300 border border-primary/20">
              <HiTag className="w-3 h-3 shrink-0" />
              <span>{safeCategory}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col h-[56%] p-5 space-y-3 bg-light/80 backdrop-blur-md border-t border-secondary/20">
        <div className="flex items-start justify-between h-14">
          <h2 className="flex-1 text-base font-extrabold text-dark leading-tight line-clamp-2 pr-6 group-hover:text-primary transition-colors duration-300">
            {truncateText(title)}
          </h2>
          <div className="shrink-0 ml-1.5">
            <div className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-primary rounded-full transition-all duration-300 shadow-md">
              <HiEye className="w-3 h-3 shrink-0" />
              <span>{views || 0}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-secondary/20 pb-2 text-xs">
          <div className="flex items-center gap-2 text-dark/80 shrink-0">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={`${author} avatar`}
                className="w-8 h-8 rounded-full object-cover border border-primary/20"
                loading="lazy"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                {authorInitial}
              </div>
            )}
            <div className="flex flex-col leading-tight">
              <span className="font-semibold max-w-24 truncate inline-flex items-center gap-1">
                <span className="truncate">{author}</span>
                {isAuthorVerified && (
                  <HiCheckBadge className="w-4 h-4 text-primary shrink-0" title="Verified author" />
                )}
              </span>
              <span className="text-[10px] text-dark/60">{formatDisplayDate(createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 h-8 px-3 text-xs font-bold rounded-full border border-warning/30 bg-warning/10 text-warning">
              <HiHeart className="w-3.5 h-3.5" />
              {likesCount}
            </span>
            <span className="inline-flex items-center gap-1 h-8 px-3 text-xs font-bold rounded-full border border-secondary/30 bg-secondary/10 text-secondary">
              <HiChatBubbleOvalLeft className="w-3.5 h-3.5" />
              {commentsCount}
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-end pb-2">
          <div className="w-full flex justify-center">
            <div className="flex items-center gap-1.5 text-dark/90 hover:text-primary font-bold text-sm group-hover:gap-2.5 transition-all duration-300">
              <span>Read More</span>
              <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

PostCard.displayName = "PostCard";
export default PostCard;
