import React, { useState, useEffect, useRef, useCallback } from "react";
import { Logo, Contaner, LogoutBtn } from "../index";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";  // ✅ ADD useDispatch
import { 
  selectIsAuthenticated, 
  selectAuthUser 
} from '../../features/auth/authSlice';
import { 
  searchPosts  // ✅ ADD searchPosts thunk
} from '../../features/post/postThunks';
import { HiOutlineBars3, HiMagnifyingGlass, HiXMark } from 'react-icons/hi2';

function Header() {
  const dispatch = useDispatch();  // ✅ Redux dispatch
  const navigate = useNavigate();
  const authStatus = useSelector(selectIsAuthenticated);
  const user = useSelector(selectAuthUser);
  const avatar = user?.avatar;
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);  // ✅ Loading state
  const menuRef = useRef(null);

  const navItems = [
    { name: "Home", slug: "/", active: true },
    { name: "Login", slug: "/login", active: !authStatus },
    { name: "Signup", slug: "/signup", active: !authStatus },
    { name: "All Posts", slug: "/all-post", active: true },
    { name: "Add Post", slug: "/add-post", active: authStatus },
    { name: "Profile", slug: "/profile", active: authStatus },
  ];

  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  // ✅ FIXED: Search with Redux API
  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setSearching(true);
    try {
      // Dispatch search thunk - updates posts in Redux
      await dispatch(searchPosts(query)).unwrap();
      
      // Navigate to search results page
      navigate(`/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      console.error("Search failed:", error);
      alert("Search failed. Please try again.");
    } finally {
      setSearching(false);
      setSearchQuery('');  // Clear input
    }
  }, [searchQuery, dispatch, navigate]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="py-4 mb-4 shadow-lg bg-primary text-white w-full z-50 fixed top-0 left-0 right-0">
      <Contaner>
        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between gap-4">
          <Link to="/" className="flex-shrink-0 border-2 border-white rounded-t-full">
            <Logo width="40px" />
          </Link>

          {/* ✅ Search Bar - Connected to Redux */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative flex w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search posts..."
                disabled={searching}
                className={`flex-1 pl-4 pr-12 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 focus:border-white focus:outline-none focus:bg-white/20 transition-all text-white placeholder-gray-300 ${
                  searching ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {searching ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <HiMagnifyingGlass className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <ul className="flex items-center gap-2 flex-shrink-0">
            {navItems.map((item) =>
              item.active ? (
                <li key={item.name}>
                  <button
                    onClick={() => navigate(item.slug)}
                    className="border-2 border-white text-black font-bold px-4 py-2 rounded-xl hover:bg-white hover:scale-[1.02] transition-all text-sm whitespace-nowrap"
                  >
                    {item.name}
                  </button>
                </li>
              ) : null
            )}
          </ul>

          {authStatus && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <LogoutBtn />
              <button
                onClick={() => navigate("/profile")}
                className="w-12 h-12 rounded-full overflow-hidden border-2 border-white hover:scale-105 transition-all"
              >
                <img
                  src={avatar || defaultAvatar}
                  className="w-full h-full object-cover"
                  alt="User Avatar"
                />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Layout */}
        <div className="sm:hidden flex items-center justify-between gap-3 px-2">
          <Link to="/" className="flex-shrink-0 border-2 border-white p-2 rounded-xl hover:bg-white hover:scale-[1.02] transition-all">
            <Logo width="36px" />
          </Link>

          {/* Mobile Search */}
          <div className="flex-1 max-w-xs mx-2">
            <div className="relative flex w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search..."
                disabled={searching}
                className={`flex-1 pl-4 pr-10 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 focus:border-white focus:outline-none focus:bg-white/20 transition-all text-white placeholder-gray-300 text-sm ${
                  searching ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-white/20 transition-all disabled:opacity-50"
                type="button"
              >
                {searching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <HiMagnifyingGlass className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={toggleMenu}
            className="p-2 rounded-lg hover:bg-white/20 transition-all z-50"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <HiXMark className="w-6 h-6" /> : <HiOutlineBars3 className="w-6 h-6" />}
          </button>
        </div>
      </Contaner>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div 
          ref={menuRef}
          className="sm:hidden fixed top-24 right-4 w-64 bg-primary/95 backdrop-blur-md border border-white/20 rounded-2xl py-6 shadow-2xl z-40 animate-in slide-in-from-right-4 duration-200"
        >
          <div className="px-6 space-y-3">
            <h3 className="text-xl font-bold text-white mb-4 border-b border-white/20 pb-3">Menu</h3>
            
            {navItems.map((item) =>
              item.active && (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.slug);
                    closeMenu();
                  }}
                  className="w-full text-left p-4 rounded-xl hover:bg-white/20 transition-all border border-white/30 text-white font-semibold text-base shadow-sm"
                >
                  {item.name}
                </button>
              )
            )}
            
            {authStatus && (
              <>
                <div className="border-t border-white/20 pt-4">
                  <LogoutBtn />
                </div>
                <button
                  onClick={() => {
                    navigate("/profile");
                    closeMenu();
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/20 transition-all border border-white/30 text-white font-semibold shadow-sm"
                >
                  <img
                    src={avatar || defaultAvatar}
                    className="w-10 h-10 rounded-full border-2 border-white flex-shrink-0"
                    alt="User Avatar"
                  />
                  <span>Profile</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
