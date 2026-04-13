import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { usePostsQuery } from "../features/post/usePostQueries";
import { Container, PostCard, LoadingAnimation, Logo } from "../components";

function Home() {
  const hasFetched = useRef(false);
  const {
    data: posts = [],
    isLoading: loading,
    error,
    refetch,
  } = usePostsQuery();
  const [initialFetchDone, setInitialFetchDone] = React.useState(false);
  
  // Show only FIRST 4 posts in ONE ROW
  const featuredPosts = Array.isArray(posts) ? posts.slice(0, 4) : [];

  useEffect(() => {
    if (!hasFetched.current) {
      refetch().finally(() => {
        setInitialFetchDone(true);
      });
      hasFetched.current = true;
    }
  }, [refetch]);

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

  if (!initialFetchDone && loading && featuredPosts.length === 0) {
    return (
      <div className="w-full pt-32 min-h-screen flex items-center justify-center bg-background dark:bg-background">
        <div className="text-center space-y-8">
          <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border-2 border-primary/20 animate-gentle-pulse">
              <div className="w-12 h-12 bg-primary/30 rounded-xl animate-pulse flex items-center justify-center">
                <Logo width="28px" />
              </div>
            </div>
            <LoadingAnimation type="spinner" size="lg" color="primary" />
            <h1 className="text-2xl font-bold text-dark/80 dark:text-light">Loading Stories...</h1>
          </div>
        </div>
      );
  }

  if (initialFetchDone && error && featuredPosts.length === 0) {
    return (
      <div className="w-full pt-32 min-h-screen bg-background dark:bg-background">
        <Container>
          <div className="max-w-xl mx-auto rounded-3xl border border-warning/20 bg-light/90 p-8 text-center dark:border-warning/30 dark:bg-dark/80">
            <h2 className="text-2xl font-black text-warning dark:text-accent">Unable to load posts</h2>
            <p className="mt-2 text-dark/70 dark:text-light/80">{error?.message || "Failed to load posts"}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-5 inline-flex h-11 items-center rounded-xl bg-primary px-5 font-semibold text-light hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </Container>
      </div>
    );
  }

  if (featuredPosts.length === 0) {
    return (
      <div className="w-full pt-32 min-h-screen bg-background dark:bg-background">
        <Container className="relative">
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
            <div className="w-32 h-32 bg-primary/5 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-12 border border-primary/10 animate-float shadow-xl">
              <div className="w-20 h-20 bg-primary/20 rounded-2xl border-2 border-primary/30 flex items-center justify-center animate-gentle-pulse">
                <Logo width="40px" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-dark mb-8 leading-tight dark:text-light">
              No Posts Yet
            </h1>
            <p className="text-xl md:text-2xl text-dark/70 mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-up dark:text-light">
              Be the first to share your story!
            </p>
            <Link 
              to="/add-post" 
              className="group relative inline-flex items-center bg-primary text-light font-bold px-12 py-5 rounded-2xl text-xl shadow-lg hover:shadow-primary/50 hover:-translate-y-1 transition-all duration-500 border-2 border-primary/20 hover:border-primary animate-slide-up dark:bg-background dark:border-light/20 dark:hover:bg-background/90 dark:hover:shadow-none"
            >
              <span className="flex items-center gap-2">
                Create First Post 
                <span className="w-2 h-2 bg-light rounded-full group-hover:translate-x-1 transition-transform"></span>
              </span>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="w-full pt-32 pb-16 bg-background dark:bg-background">
      <Container className="relative">
        {/* ORIGINAL Hero Section - UNCHANGED */}
        <div className="text-center py-24 mb-20">
          <h1 className="text-5xl md:text-7xl font-black text-dark mb-8 leading-tight animate-slide-up dark:text-light">
            Discover
            <span className="block text-6xl md:text-8xl text-primary font-black animate-float">Stories</span>
          </h1>
          <p className="text-2xl md:text-3xl text-dark/70 max-w-4xl mx-auto mb-16 leading-relaxed animate-slide-up dark:text-light">
            Explore latest posts from creators around the world
          </p>
          <div className="flex flex-wrap gap-4 justify-center max-w-xl mx-auto animate-slide-up">
            <div className="group flex items-center gap-3 px-8 py-4 bg-primary/5 backdrop-blur-xl rounded-2xl border-2 border-primary/10 hover:bg-primary/10 hover:border-primary/20 hover:shadow-lg transition-all duration-500 dark:bg-background dark:border-light/20">
              <div className="w-3 h-3 bg-primary rounded-full animate-gentle-pulse"></div>
              <Link 
                to="/all-post" 
                className="font-bold text-xl text-dark dark:text-light"
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
              />
            </div>
          ))}
        </div>

        {/* Feedback/Testimonial Card */}
        <section className="py-24 mb-20 text-center animate-slide-up" style={{animationDelay: '0.8s'}}>
          <div className="max-w-4xl mx-auto">
            <div className="bg-light backdrop-blur-xl rounded-3xl p-12 lg:p-20 border-2 border-primary/10 shadow-2xl dark:bg-background dark:border-light/20">
              <div className="w-28 h-28 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-12 border-2 border-primary/20 animate-gentle-pulse shadow-xl">
                <svg className="w-14 h-14 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-dark mb-8 leading-tight dark:text-light">
                Loved these stories?
              </h2>
              <p className="text-2xl text-dark/70 mb-16 leading-relaxed max-w-3xl mx-auto dark:text-light">
                Join our community of passionate writers and avid readers. Share your voice or discover incredible stories from creators worldwide.
              </p>
              <div className="flex flex-col lg:flex-row gap-6 justify-center items-stretch lg:items-center">
                <Link 
                  to="/add-post"
                  className="group bg-primary text-light font-black py-4 px-8 rounded-2xl shadow-xl hover:shadow-primary/50 hover:-translate-y-2 transition-all duration-500 text-lg border-2 border-primary/20 hover:border-primary flex items-center justify-center gap-4 flex-1 lg:flex-none w-full lg:w-auto dark:bg-background dark:border-light/20 dark:hover:bg-background/90 dark:hover:shadow-none"
                >
                  Write Your Story
                  <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Link>
                <Link 
                  to="/all-post"
                  className="group bg-dark text-light font-black py-4 px-8 rounded-2xl shadow-xl hover:shadow-dark/20 hover:-translate-y-2 transition-all duration-500 text-lg border-2 border-dark/30 hover:border-dark flex items-center justify-center gap-4 flex-1 lg:flex-none w-full lg:w-auto dark:bg-background dark:border-light/20 dark:hover:bg-background/90 dark:hover:shadow-none"
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

      </Container>
    </div>
  );
}

export default React.memo(Home);
