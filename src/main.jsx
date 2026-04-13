import { createRoot } from 'react-dom/client';
import Signup from './pages/Signup.jsx';
import App from './App.jsx';
import Home from "./pages/Home.jsx";
import AllPosts from './pages/AllPosts.jsx';
import Post from './pages/Post.jsx';
import AddPost from './pages/AddPost.jsx';
import EditPost from './pages/EditPost.jsx';
import Profile from './pages/Profile.jsx';
import ProfileSettings from './pages/ProfileSettings.jsx';
import Search from './pages/Search.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import About from './pages/About.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminProfile from './pages/AdminProfile.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminUserProfile from './pages/AdminUserProfile.jsx';
import AuthorDashboard from './pages/AuthorDashboard.jsx';
import Authors from './pages/Authors.jsx';
import { Provider } from 'react-redux';
import { store } from './app/store.js';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Login, AuthLayout } from './components';
import { StrictMode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: '/', element: <Home /> },
      {
        path: "/login",
        element: (
          <AuthLayout authentication={false}>
            <Login />
          </AuthLayout>
        ),
      },
      {
        path: "/signup",
        element: (
          <AuthLayout authentication={false}>
            <Signup />
          </AuthLayout>
        ),
      },
      {
        path: "/forgot-password",
        element: (
          <AuthLayout authentication={false}>
            <ForgotPassword />
          </AuthLayout>
        ),
      },
      { path: "/all-post", element: <AllPosts /> },
      { path: "/about", element: <About /> },
      {
        path: "/add-post",
        element: (
          <AuthLayout authentication allowedRoles={["admin", "author"]}>
            <AddPost />
          </AuthLayout>
        ),
      },
      {
        path: "/edit-post/:postId",
        element: (
          <AuthLayout authentication allowedRoles={["admin", "author"]}>
            <EditPost />
          </AuthLayout>
        ),
      },
      { path: "/post/:postId", element: <Post /> },
      {
        path: "/profile",
        element: (
          <AuthLayout authentication>
            <Profile />
          </AuthLayout>
        ),
      },
      {
        path: "/profile/settings",
        element: (
          <AuthLayout authentication>
            <ProfileSettings />
          </AuthLayout>
        ),
      },
      {
        path: "/admin/profile",
        element: (
          <AuthLayout authentication allowedRoles={["admin", "superadmin"]}>
            <AdminProfile />
          </AuthLayout>
        ),
      },
      {
        path: "/admin/dashboard",
        element: (
          <AuthLayout authentication allowedRoles={["admin", "superadmin"]}>
            <AdminDashboard />
          </AuthLayout>
        ),
      },
      {
        path: "/admin/users",
        element: (
          <AuthLayout authentication allowedRoles={["admin", "superadmin"]}>
            <AdminUsers />
          </AuthLayout>
        ),
      },
      {
        path: "/admin/users/:userId",
        element: (
          <AuthLayout authentication allowedRoles={["admin", "superadmin"]}>
            <AdminUserProfile />
          </AuthLayout>
        ),
      },
      {
        path: "/author/dashboard",
        element: (
          <AuthLayout authentication allowedRoles={["author"]}>
            <AuthorDashboard />
          </AuthLayout>
        ),
      },
      {
        path: "/authors",
        element: (
          <AuthLayout authentication>
            <Authors />
          </AuthLayout>
        ),
      },
      { path: "/search", element: <Search /> },
    ],
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
);
