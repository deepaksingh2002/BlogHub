import React, { memo } from "react";
import { Link } from "react-router-dom";

const PostCard = memo(function PostCard({ post }) {
  if (!post) return null;

  const {
    title,
    thumbnail,
    createdAt,
    owner,
    category, // ✅ Fixed: was catagry
    views
  } = post;

  const author = owner?.username || "Unknown Author";
  const safeCategory = category || ""; // ✅ Fixed

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

  const optimizeImageUrl = (url) => {
    if (!url) return "";
    if (url.includes("cloudinary.com")) {
      const parts = url.split("/upload/");
      if (parts.length === 2) {
        return `${parts[0]}/upload/q_80,w_400,c_fill,ar_4:3/${parts[1]}`;
      }
    }
    return url;
  };

  const truncateText = (text, maxLength = 60) => {
    if (!text) return "Untitled Post";
    return text.length > maxLength
      ? text.slice(0, maxLength) + "..."
      : text;
  };

  return (
    <Link
      to={`/post/${post._id}`}
      className="block group h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-2xl"
      aria-label={`Read post: ${title || "Untitled"}`}
    >
      <article className="bg-white p-4 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden border border-gray-100">
        <div className="w-full mb-4 overflow-hidden rounded-xl aspect-[4/3] bg-gray-100">
          <img
            src={optimizeImageUrl(thumbnail)}
            alt={title || "Post thumbnail"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

        <div className="flex flex-col flex-grow">
          <div className="flex flex-row justify-between">
            {safeCategory && (
              <span className="mb-2 inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full w-fit">
                {safeCategory}
              </span>
            )}
            <span className="mb-2 inline-block text-gray-500 text-xs font-semibold px-3 py-1 rounded-full w-fit">
              views: {views}
            </span>
          </div>
          
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 flex-grow">
            {truncateText(title)}
          </h2>

          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
            <p>
              <span className="font-semibold">By </span>
              {author}
            </p>
            {createdAt && (
              <p>
                <span className="font-semibold">Published </span>
                {formatDate(createdAt)}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center text-blue-600 group-hover:text-blue-700 text-sm font-semibold">
            Read Post
            <svg
              className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
        </div>
      </article>
    </Link>
  );
});

PostCard.displayName = "PostCard";
export default PostCard;
