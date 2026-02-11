import React from 'react';

const LoadingAnimation = ({ 
  type = 'spinner', 
  size = 'md', 
  color = 'primary',
  className = '' 
}) => {
  const sizeClasses = {
    xs: 'w-5 h-5',
    sm: 'w-6 h-6', 
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorMap = {
    primary: 'bg-primary/90 border-primary/20 shadow-primary/20',
    secondary: 'bg-secondary/90 border-secondary/20 shadow-secondary/20',
    accent: 'bg-accent/90 border-accent/20 shadow-accent/20'
  };

  // Inject smooth CSS animations once
  React.useEffect(() => {
    if (!document.getElementById('loading-animations')) {
      const style = document.createElement('style');
      style.id = 'loading-animations';
      style.textContent = `
        @keyframes gentleSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes softPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } }
        @keyframes smoothBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes waveFlow { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        @keyframes rippleGlow { 0% { box-shadow: 0 0 0 0 rgba(242, 106, 27, 0.4); } 70% { box-shadow: 0 0 0 12px rgba(242, 106, 27, 0); } 100% { box-shadow: 0 0 0 0 rgba(242, 106, 27, 0); } }
        @keyframes shimmerSlide { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        
        .animate-gentle-spin { animation: gentleSpin 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .animate-soft-pulse { animation: softPulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .animate-smooth-bounce { animation: smoothBounce 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .animate-wave-flow { animation: waveFlow 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .animate-ripple-glow { animation: rippleGlow 2s linear infinite; }
        .animate-shimmer-slide { animation: shimmerSlide 2s linear infinite; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  switch (type) {
    case 'spinner':
      return (
        <div className={`${sizeClasses[size]} ${colorMap[color]} rounded-full border-2 border-l-transparent animate-gentle-spin shadow-lg ${className}`} />
      );

    case 'pulse':
      return (
        <div className={`${sizeClasses[size]} ${colorMap[color]} rounded-2xl animate-soft-pulse shadow-xl ${className}`} />
      );

    case 'bounce':
      return (
        <div className="flex gap-1.5 items-end">
          {[0, 0.15, 0.3].map((delay, i) => (
            <div
              key={i}
              className={`${sizeClasses[size === 'xl' ? 'lg' : size]} h-3 bg-primary/90 rounded-full animate-smooth-bounce shadow-md`}
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
      );

    case 'shimmer':
      return (
        <div className={`relative p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-primary/10 shadow-xl overflow-hidden ${className}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slide" />
          <div className={`${sizeClasses[size]} h-10 bg-gradient-to-r from-primary/40 to-primary/20 rounded-xl relative z-10 animate-soft-pulse mx-auto`} />
        </div>
      );

    case 'ripple':
      return (
        <div className={`${sizeClasses[size]} ${colorMap[color]} rounded-full relative overflow-hidden animate-ripple-glow shadow-xl ${className}`}>
          <div className={`${sizeClasses[size]} bg-primary/80 rounded-full animate-gentle-spin`} />
        </div>
      );

    case 'wave':
      return (
        <div className="flex flex-col gap-1.5">
          {[0, 0.1, 0.2].map((delay, i) => (
            <div
              key={i}
              className={`${sizeClasses[size === 'xl' ? 'md' : size]} h-2 bg-gradient-to-r from-primary/80 to-primary/40 rounded-xl animate-wave-flow shadow-md`}
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
      );

    case 'dots':
      return (
        <div className="flex gap-1.5">
          {[0, 0.2, 0.4].map((delay, i) => (
            <div
              key={i}
              className={`${sizeClasses[size === 'xl' ? 'sm' : 'xs']} h-2 ${colorMap[color]} rounded-full animate-soft-pulse`}
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
      );

    default:
      return (
        <div className={`${sizeClasses[size]} ${colorMap[color]} rounded-full border-2 border-l-transparent animate-gentle-spin shadow-lg ${className}`} />
      );
  }
};

export default LoadingAnimation;
