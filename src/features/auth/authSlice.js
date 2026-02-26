import { createSlice, createSelector } from "@reduxjs/toolkit";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  updateUserAvatar,
  changeUserPassword,
} from "./authThunks";

const AUTH_USER_STORAGE_KEY = "bloghub_auth_user";

const loadPersistedUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persistUser = (user) => {
  if (typeof window === "undefined") return;
  try {
    if (!user) {
      window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage failures.
  }
};

const persistedUser = loadPersistedUser();

const initialState = {
  user: persistedUser,
  loading: false,
  error: null,
  message: null,
  isAuthenticated: Boolean(persistedUser),
  authChecked: false, 
};

const pickUserFromPayload = (payload) => {
  if (!payload) return null;
  return (
    payload.user ||
    payload.data?.user ||
    payload.data ||
    null
  );
};

const pickMessageFromPayload = (payload) =>
  payload?.message || payload?.data?.message || null;

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthState: (state) => {
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload?.message;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = pickUserFromPayload(action.payload);
        state.isAuthenticated = Boolean(state.user);
        persistUser(state.user);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = pickUserFromPayload(action.payload);
        state.isAuthenticated = Boolean(state.user);
        state.authChecked = true;
        state.error = null;
        persistUser(state.user);
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        const statusCode = action.payload?.statusCode || null;
        const isUnauthorized = statusCode === 401;

        if (isUnauthorized) {
          state.user = null;
          state.isAuthenticated = false;
          persistUser(null);
        } else {
          // Keep prior session on transient failures (timeout/offline).
          state.isAuthenticated = Boolean(state.user);
        }

        state.error = action.payload?.message || action.error?.message || null;
        state.authChecked = true;
      })
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = pickUserFromPayload(action.payload) || state.user;
        state.isAuthenticated = Boolean(state.user);
        persistUser(state.user);
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = pickUserFromPayload(action.payload) || state.user;
        state.message = pickMessageFromPayload(action.payload);
        state.isAuthenticated = Boolean(state.user);
        persistUser(state.user);
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUserAvatar.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(updateUserAvatar.fulfilled, (state, action) => {
        state.loading = false;
        state.user = pickUserFromPayload(action.payload) || state.user;
        state.message = pickMessageFromPayload(action.payload);
        state.isAuthenticated = Boolean(state.user);
        persistUser(state.user);
      })
      .addCase(updateUserAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(changeUserPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(changeUserPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = pickMessageFromPayload(action.payload);
      })
      .addCase(changeUserPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.authChecked = true;
        persistUser(null);
      });
  },
});

export const { clearAuthState } = authSlice.actions;
export default authSlice.reducer;

// ✅ OPTIMIZED SELECTORS
export const selectAuthUser = createSelector(
  [(state) => state.auth.user],
  (user) => user
);

export const selectAuthLoading = createSelector(
  [(state) => state.auth.loading],
  (loading) => loading
);

export const selectAuthError = createSelector(
  [(state) => state.auth.error],
  (error) => error
);

export const selectAuthMessage = createSelector(
  [(state) => state.auth.message],
  (message) => message
);

export const selectIsAuthenticated = createSelector(
  [(state) => state.auth.isAuthenticated],
  (isAuth) => isAuth
);

export const selectAuthChecked = createSelector(
  [(state) => state.auth.authChecked],
  (checked) => checked
);
