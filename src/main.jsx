import { createRoot } from 'react-dom/client';
import Signup from './pages/Signup.jsx';
import App from './App.jsx';
import Home from "./pages/Home.jsx";
import AllPosts from './pages/AllPosts.jsx';
import Post from './pages/Post.jsx';
import AddPost from './pages/AddPost.jsx';
import EditPost from './pages/EditPost.jsx';
import Profile from './pages/Profile.jsx';
import Search from './pages/Search.jsx';
import { Provider } from 'react-redux';
import { store } from './app/store.js';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Login, AuthLayout } from './components';
import { StrictMode } from 'react';

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
      { path: "/all-post", element: <AllPosts /> },
      {
        path: "/add-post",
        element: (
          <AuthLayout authentication>
            <AddPost />
          </AuthLayout>
        ),
      },
      {
        path: "/edit-post/:postId",
        element: (
          <AuthLayout authentication>
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
      { path: "/search", element: <Search /> },
    ],
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);
