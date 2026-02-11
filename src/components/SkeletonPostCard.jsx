import React from "react";
import LoadingAnimation from './LoadingAnimation';

const SkeletonPostCard = React.memo(() => (
  <div className="h-[360px] rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-primary/10 shadow-lg hover:shadow-xl overflow-hidden group hover:scale-[1.02] transition-all duration-300 animate-slide-up">
    
    <div className="h-[42%] bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
      <LoadingAnimation type="shimmer" size="lg" className="absolute inset-0" />
      <div className="absolute top-4 left-4 w-20 h-6 bg-white/20 backdrop-blur-sm rounded-full animate-soft-pulse" />
    </div>

    <div className="h-[58%] p-5 space-y-4 bg-white/5 backdrop-blur-md border-t border-white/10">
      
      <div className="space-y-2">
        <div className="h-6 bg-gradient-to-r from-white/20 to-white/10 rounded-lg w-4/5 animate-soft-pulse" />
        <div className="flex justify-end">
          <div className="w-16 h-6 bg-primary/40 rounded-full animate-ripple-glow" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/20 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full animate-gentle-spin" />
          <div className="space-y-1">
            <div className="h-3.5 w-20 bg-white/20 rounded animate-soft-pulse" />
            <div className="h-3 w-16 bg-gray-200/50 rounded animate-soft-pulse" />
          </div>
        </div>
        <div className="w-16 h-6 bg-primary/50 rounded-full animate-smooth-bounce" />
      </div>

      <div className="flex-1 flex items-end pb-2">
        <div className="w-full flex justify-center gap-2 animate-wave-flow">
          <div className="h-4 w-20 bg-white/30 rounded animate-soft-pulse" />
          <div className="w-4 h-4 bg-primary/60 rounded-full animate-smooth-bounce" />
        </div>
      </div>
    </div>
  </div>
));

SkeletonPostCard.displayName = "SkeletonPostCard";
export default SkeletonPostCard;
