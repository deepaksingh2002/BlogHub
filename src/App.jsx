import { useEffect, useState } from 'react';
import './App.css';
import { useSelector } from 'react-redux';
import { selectAuthChecked } from "./features/auth/authSlice";
import { Footer, Header } from './components';
import { Outlet, useLocation } from 'react-router-dom';
import { useBootstrapCurrentUserQuery } from './features/auth/useAuthQueries';

function App() {
  const location = useLocation();
  const authChecked = useSelector(selectAuthChecked);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useBootstrapCurrentUserQuery(!authChecked);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
    setIsDarkMode(shouldUseDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  return (
    <div className="min-h-screen flex flex-col bg-beige text-dark transition-colors dark:bg-background dark:text-dark">
      <Header isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default App;
