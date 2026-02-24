# BlogHub

A modern blog frontend built with React, Vite, Redux Toolkit, and Tailwind CSS.

This app supports user authentication, post creation/editing, profile management, and post search. It integrates with a backend API and uses cookie-based auth with automatic token refresh.

## Features

- User authentication (signup, login, logout)
- Protected routes for authenticated pages
- Create, edit, delete, and view blog posts
- Like/unlike posts with authenticated sessions
- Rich text editor for post content (TinyMCE)
- User profile and avatar update flows
- Search posts from the header
- Responsive UI for desktop and mobile

## Tech Stack

- React 19
- Vite 7
- Redux Toolkit + React Redux
- React Router DOM 7
- Tailwind CSS 4
- Axios
- React Hook Form
- TinyMCE React

## Prerequisites

- Node.js 18+
- npm 9+

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/deepaksingh2002/full-stack-bloging-web.git
cd BlogingFrontend
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_API_URL=https://your-backend-url
VITE_TINYMCE_API_KEY=your_tinymce_api_key
```

4. Start the development server

```bash
npm run dev
```

The app will run on the local Vite URL (typically `http://localhost:5173`).

## Available Scripts

- `npm run dev`: Starts Vite in development mode
- `npm run build`: Creates a production build in `dist/`
- `npm run preview`: Serves the production build locally
- `npm run lint`: Runs ESLint checks

## Project Structure

```text
src/
  app/                # Redux store setup
  components/         # Reusable UI and feature components
  features/
    auth/             # Auth API, thunks, and slice
    post/             # Post API, thunks, and slice
  pages/              # Route-level pages
  main.jsx            # Router + app bootstrap
```

## Authentication Notes

- Requests use `withCredentials: true` for cookie-based sessions.
- On `401`, auth and post APIs attempt token refresh and retry automatically.
- If refresh fails, protected routes redirect users to `/login` via route guards.

## Build and Deployment

Build for production:

```bash
npm run build
```

This project includes `vercel.json` rewrite rules for SPA routing, so direct route access works when deployed on Vercel.

## API Expectation

The frontend expects backend endpoints under:

- `${VITE_API_URL}/api/v1/users`
- `${VITE_API_URL}/api/v1/post`
- `${VITE_API_URL}/api/v1/like`

Like routes used by frontend:

- `POST /api/v1/like/toggle/post/:postId`
- `POST /api/v1/like/toggle/comment/:commentId`
- `GET /api/v1/like/liked/posts`

Make sure your backend CORS and cookie settings allow frontend origin + credentials.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
