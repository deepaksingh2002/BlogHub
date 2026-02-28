import React from 'react';
import { Link } from "react-router-dom";
import Logo from '../Logo';

function Footer() {
  return (
    <footer className="w-full pt-12 pb-8 bg-gradient-to-t from-primary/95 to-primary/80 border-t-2 border-primary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                <Logo width="48px" className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2">BlogHub</h2>
                <p className="text-white/80 text-sm max-w-xs leading-relaxed">
                  Share your stories with the world
                </p>
              </div>
            </div>
          </div>

          {/* Blog Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wide">Blog</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-white/90 hover:text-white hover:underline font-medium text-sm transition-all duration-300 block pb-1 border-b border-transparent hover:border-white/50">Home</Link></li>
              <li><Link to="/all-post" className="text-white/90 hover:text-white hover:underline font-medium text-sm transition-all duration-300 block pb-1 border-b border-transparent hover:border-white/50">All Posts</Link></li>
              <li><Link to="/add-post" className="text-white/90 hover:text-white hover:underline font-medium text-sm transition-all duration-300 block pb-1 border-b border-transparent hover:border-white/50">Create Post</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wide">Company</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-white/90 hover:text-white hover:underline font-medium text-sm transition-all duration-300 block pb-1 border-b border-transparent hover:border-white/50">About</Link></li>
              <li><Link to="/profile" className="text-white/90 hover:text-white hover:underline font-medium text-sm transition-all duration-300 block pb-1 border-b border-transparent hover:border-white/50">Profile</Link></li>
              <li><Link to="/about" className="text-white/90 hover:text-white hover:underline font-medium text-sm transition-all duration-300 block pb-1 border-b border-transparent hover:border-white/50">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="hidden md:block">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wide">Legal</h3>
            <ul className="space-y-3">
              <li><Link to="/privacy" className="text-white/90 hover:text-white hover:underline font-medium text-sm transition-all duration-300 block pb-1 border-b border-transparent hover:border-white/50">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-white/90 hover:text-white hover:underline font-medium text-sm transition-all duration-300 block pb-1 border-b border-transparent hover:border-white/50">Terms & Conditions</Link></li>
              <li><Link to="/cookies" className="text-white/90 hover:text-white hover:underline font-medium text-sm transition-all duration-300 block pb-1 border-b border-transparent hover:border-white/50">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Trademark */}
        <div className="pt-8 mt-12 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-sm">
            <div className="text-white/70">
              © 2025 deepaksingh2002. All rights reserved. 
              <span className="ml-1">™</span>
            </div>
            <div className="flex flex-wrap gap-6 justify-center md:justify-end text-white/70 text-xs">
              <Link to="/privacy" className="hover:text-white transition-colors duration-200">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors duration-200">Terms</Link>
              <Link to="/cookies" className="hover:text-white transition-colors duration-200">Cookies</Link>
              <span>Made with ❤️ in India</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
