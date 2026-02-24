import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllPosts, togglePostLike } from "../features/post/postThunks";
import { Link } from "react-router-dom";
import { 
  selectAllPosts, 
  selectPostLoading 
} from "../features/post/postSlice";
import { Contaner, PostCard, LoadingAnimation, Logo } from "../components";
import { selectIsAuthenticated } from "../features/auth/authSlice";

function Home() {
  const dispatch = useDispatch();
  const hasFetched = useRef(false);
  const posts = useSelector(selectAllPosts);
  const loading = useSelector(selectPostLoading);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  // Show only FIRST 4 posts in ONE ROW
  const featuredPosts = Array.isArray(posts) ? posts.slice(0, 4) : [];

  useEffect(() => {
    if (!hasFetched.current) {
      dispatch(getAllPosts());
      hasFetched.current = true;
    }
  }, [dispatch]);

  const handleLike = (postId) => {
    if (!isAuthenticated) return;
    dispatch(togglePostLike(postId));
  };

  // Smooth animations - single color focus
  useEffect(() => {
    if (!document.getElementById('home-animations')) {
      const style = document.createElement('style');
      style.id = 'home-animations';
      style.textContent = `
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gentle-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.7s ease-out forwards; }
        .animate-gentle-pulse { animation: gentle-pulse 2s ease-in-out infinite; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (loading) {
    return (
      <div className="w-full pt-32 min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center space-y-8">
          <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border-2 border-primary/20 animate-gentle-pulse">
            <div className="w-12 h-12 bg-primary/30 rounded-xl animate-pulse flex items-center justify-center font-bold text-sm text-white">
              {Logo}
            </div>
          </div>
          <LoadingAnimation type="spinner" size="lg" color="primary" />
          <h1 className="text-2xl font-bold text-black/80">Loading Stories...</h1>
        </div>
      </div>
    );
  }

  if (featuredPosts.length === 0) {
    return (
      <div className="w-full pt-32 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Contaner className="relative">
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
            <div className="w-32 h-32 bg-primary/5 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-12 border border-primary/10 animate-float shadow-xl">
              <div className="w-20 h-20 bg-primary/20 rounded-2xl border-2 border-primary/30 flex items-center justify-center font-bold text-lg text-primary animate-gentle-pulse">
                {Logo}
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-black mb-8 leading-tight">
              No Posts Yet
            </h1>
            <p className="text-xl md:text-2xl text-black/70 mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-up">
              Be the first to share your story!
            </p>
            <Link 
              to="/add-post" 
              className="group relative inline-flex items-center bg-primary text-white font-bold px-12 py-5 rounded-2xl text-xl shadow-lg hover:shadow-primary/50 hover:-translate-y-1 transition-all duration-500 border-2 border-primary/20 hover:border-primary animate-slide-up"
            >
              <span className="flex items-center gap-2">
                Create First Post 
                <span className="w-2 h-2 bg-white rounded-full group-hover:translate-x-1 transition-transform"></span>
              </span>
            </Link>
          </div>
        </Contaner>
      </div>
    );
  }

  return (
    <div className="w-full pt-32 pb-16 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Contaner className="relative">
        {/* ORIGINAL Hero Section - UNCHANGED */}
        <div className="text-center py-24 mb-20">
          <h1 className="text-6xl md:text-8xl font-black text-black mb-8 leading-tight animate-slide-up">
            Discover
            <span className="block text-7xl md:text-9xl text-primary font-black animate-float">Stories</span>
          </h1>
          <p className="text-2xl md:text-3xl text-black/70 max-w-4xl mx-auto mb-16 leading-relaxed animate-slide-up">
            Explore latest posts from creators around the world
          </p>
          <div className="flex flex-wrap gap-4 justify-center max-w-xl mx-auto animate-slide-up">
            <div className="group flex items-center gap-3 px-8 py-4 bg-primary/5 backdrop-blur-xl rounded-2xl border-2 border-primary/10 hover:bg-primary/10 hover:border-primary/20 hover:shadow-lg transition-all duration-500">
              <div className="w-3 h-3 bg-primary rounded-full animate-gentle-pulse"></div>
              <Link 
                to="/all-post" 
                className="font-bold text-xl text-black"
              >
                Latest Posts
              </Link>
            </div>
          </div>
        </div>

        {/* ONE ROW: 4 Posts Horizontal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-24 px-4 lg:px-0">
          {featuredPosts.map((post, index) => (
            <div 
              key={post._id || post.slug}
              className="animate-slide-up group hover:scale-[1.02] transition-transform duration-300"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <PostCard
                post={post}
                onLike={handleLike}
                likes={post?.likesCount ?? (Array.isArray(post?.likes) ? post.likes.length : Number(post?.likes) || 0)}
                liked={Boolean(post?.isLiked ?? post?.liked ?? post?.likedByCurrentUser)}
              />
            </div>
          ))}
        </div>

        {/* Feedback/Testimonial Card */}
        <section className="py-24 mb-20 text-center animate-slide-up" style={{animationDelay: '0.8s'}}>
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-primary/5 via-white/80 to-primary/5 backdrop-blur-xl rounded-3xl p-12 lg:p-20 border-2 border-primary/10 shadow-2xl">
              <div className="w-28 h-28 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-12 border-2 border-primary/20 animate-gentle-pulse shadow-xl">
                <svg className="w-14 h-14 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-black mb-8 leading-tight">
                Loved these stories?
              </h2>
              <p className="text-2xl text-black/70 mb-16 leading-relaxed max-w-3xl mx-auto">
                Join our community of passionate writers and avid readers. Share your voice or discover incredible stories from creators worldwide.
              </p>
              <div className="flex flex-col lg:flex-row gap-6 justify-center items-stretch lg:items-center">
                <Link 
                  to="/add-post"
                  className="group bg-primary text-white font-black py-6 px-12 rounded-2xl shadow-xl hover:shadow-primary/50 hover:-translate-y-2 transition-all duration-500 text-xl border-2 border-primary/20 hover:border-primary flex items-center justify-center gap-4 flex-1 lg:flex-none w-full lg:w-auto"
                >
                  Write Your Story
                  <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Link>
                <Link 
                  to="/all-post"
                  className="group bg-gradient-to-r from-gray-800 to-gray-900 text-white font-black py-6 px-12 rounded-2xl shadow-xl hover:shadow-gray-700 hover:-translate-y-2 transition-all duration-500 text-xl border-2 border-gray-800/30 hover:border-gray-700 flex items-center justify-center gap-4 flex-1 lg:flex-none w-full lg:w-auto"
                >
                  Read More Stories
                  <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <div className="text-center pt-24 pb-12">
          <Link 
            to="/all-post"
            className="group relative inline-flex items-center bg-primary text-white font-black px-24 py-8 rounded-3xl text-2xl shadow-3xl hover:shadow-primary/60 hover:-translate-y-4 transition-all duration-700 border-2 border-primary/20 hover:border-primary overflow-hidden"
          >
            <span className="flex items-center gap-4">
              View All Stories ({posts.length || 0}+)
              <span className="w-3 h-3 bg-white rounded-full group-hover:translate-x-4 transition-all duration-500"></span>
            </span>
          </Link>
        </div>
      </Contaner>
    </div>
  );
}

export default React.memo(Home);
