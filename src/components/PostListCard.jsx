import React, { memo } from "react";
import { Link } from "react-router-dom";
import { HiCalendarDays, HiEye, HiHeart, HiTag, HiArrowUpRight, HiCheckBadge } from "react-icons/hi2";
import {
  formatDisplayDate,
  getPostLikesCount,
  getPostOwner,
  getUserDisplayName,
  isVerifiedAuthor,
  resolvePostCategory,
} from "../utils/postHelpers";

const PostListCard = memo(function PostListCard({ post }) {
  if (!post) return null;

  const title = post?.title || "Untitled Post";
  const createdAt = post?.createdAt;
  const category = resolvePostCategory(post);
  const owner = getPostOwner(post);
  const author = getUserDisplayName(owner, "Unknown Author");
  const isAuthorVerified = isVerifiedAuthor(owner);
  const views = Number(post?.views || 0);
  const likes = getPostLikesCount(post);

  const extractExcerpt = (html = "", maxLength = 160) => {
    const plain = String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!plain) return "Read the full post for details.";
    return plain.length > maxLength ? `${plain.slice(0, maxLength).trim()}...` : plain;
  };

  const tagList = Array.isArray(post?.tags) && post.tags.length
    ? post.tags.slice(0, 5)
    : [category || "General"];

  const excerpt = extractExcerpt(post?.excerpt || post?.content);
  const readTime = Math.max(1, Math.ceil(excerpt.split(" ").length / 220));
  const cover = post?.thumbnail || "https://via.placeholder.com/900x600?text=Blog+Post";

  return (
    <Link
      to={`/post/${post._id}`}
      className="group block rounded-3xl border border-secondary/20 bg-light p-4 md:p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20"
      aria-label={`Read post: ${title}`}
    >
      <div className="flex flex-col md:flex-row gap-5">
        <div className="relative md:w-64 lg:w-72 shrink-0 overflow-hidden rounded-2xl border border-secondary/20">
          <img
            src={cover}
            alt={title}
            className="h-44 md:h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/0 to-transparent" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
            <HiTag className="h-3.5 w-3.5" />
            {category || "General"}
          </span>
          <span className="absolute left-3 bottom-3 inline-flex items-center rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {readTime} min read
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-3 text-sm text-dark/60">
            <span className="inline-flex items-center gap-1 font-semibold text-dark/80">
              {author}
              {isAuthorVerified && (
                <HiCheckBadge className="h-4 w-4 text-primary" title="Verified author" />
              )}
            </span>
            <span className="inline-flex items-center gap-1">
              <HiCalendarDays className="h-4 w-4" />
              {formatDisplayDate(createdAt)}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-dark leading-tight mb-3 group-hover:text-primary transition-colors">
            {title}
          </h2>

          <p className="text-base text-dark/70 leading-relaxed mb-4 max-w-4xl">
            {excerpt}
          </p>

          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {tagList.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="inline-flex items-center rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className="inline-flex h-8 items-center gap-1 rounded-full bg-primary/10 px-3 text-xs font-bold text-primary">
                <HiEye className="h-4 w-4" /> {views}
              </span>
              <span className="inline-flex h-8 items-center gap-1 rounded-full bg-warning/10 px-3 text-xs font-bold text-warning">
                <HiHeart className="h-4 w-4" /> {likes}
              </span>
              <span className="inline-flex h-8 items-center gap-1 rounded-full bg-dark px-3 text-xs font-bold text-light">
                Read
                <HiArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

PostListCard.displayName = "PostListCard";
export default PostListCard;
