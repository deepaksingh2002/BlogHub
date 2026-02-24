import React, { memo } from "react";
import { Link } from "react-router-dom";

const PostListCard = memo(function PostListCard({ post }) {
  if (!post) return null;

  const title = post?.title || "Untitled Post";
  const createdAt = post?.createdAt;
  const category = post?.category || "";
  const author = post?.owner?.username || "Unknown Author";
  const views = Number(post?.views || 0);
  const likes =
    post?.likesCount ??
    (Array.isArray(post?.likes) ? post.likes.length : Number(post?.likes) || 0);

  const extractExcerpt = (html = "", maxLength = 160) => {
    const plain = String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!plain) return "Read the full post for details.";
    return plain.length > maxLength ? `${plain.slice(0, maxLength).trim()}...` : plain;
  };

  const formatDate = (date) => {
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

  const tagList = Array.isArray(post?.tags) && post.tags.length
    ? post.tags.slice(0, 5)
    : [category || "General"];

  return (
    <Link
      to={`/post/${post._id}`}
      className="group block py-6 border-b border-gray-200 dark:border-slate-700"
      aria-label={`Read post: ${title}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 text-base text-gray-500 dark:text-slate-400 mb-2">
            <span>{author}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-slate-100 leading-tight mb-3 group-hover:text-primary transition-colors">
            {title}
          </h2>
          <p className="text-base text-gray-600 dark:text-slate-300 leading-relaxed mb-4 max-w-4xl">
            {extractExcerpt(post?.excerpt || post?.content)}
          </p>
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {tagList.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="inline-flex items-center px-3 py-1 rounded-md bg-gray-100 text-gray-600 text-sm dark:bg-slate-800 dark:text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-gray-500 dark:text-slate-400 sm:justify-end">
              <span>{views} views</span>
              <span>{likes} likes</span>
              <span>{formatDate(createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 mt-1">
          <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-700 dark:text-slate-200 group-hover:bg-primary group-hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H9m8 0v8" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
});

PostListCard.displayName = "PostListCard";
export default PostListCard;
