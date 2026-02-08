// src/components/SkeletonPostCard.jsx
import React from "react";

const SkeletonPostCard = React.memo(() => (
  <div className="bg-white p-4 rounded-2xl shadow-md h-[340px] animate-pulse border border-gray-100">
    <div className="w-full h-48 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl mb-4"></div>
    <div className="w-20 h-5 bg-gray-200 rounded-full mb-3"></div>
    <div className="space-y-3">
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
    </div>
    <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
      <div className="h-4 bg-gray-200 rounded w-32"></div>
    </div>
    <div className="mt-4 h-6 bg-gray-200 rounded w-20"></div>
  </div>
));

SkeletonPostCard.displayName = "SkeletonPostCard";
export default SkeletonPostCard;
