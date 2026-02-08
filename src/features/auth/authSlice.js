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

const initialState = {
  user: null,
  loading: false,
  error: null,
  message: null,
  isAuthenticated: false,
  authChecked: false, 
};

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
        state.user = action.payload?.user || action.payload;
        state.isAuthenticated = true;
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
        state.user = action.payload?.user || action.payload;
        state.isAuthenticated = true;
        state.authChecked = true;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.authChecked = true;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.user = action.payload?.user || state.user;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload?.user || state.user;
        state.message = action.payload?.message;
      })
      .addCase(updateUserAvatar.fulfilled, (state, action) => {
        state.user = action.payload?.user || state.user;
        state.message = action.payload?.message;
      })
      .addCase(changeUserPassword.fulfilled, (state, action) => {
        state.message = action.payload?.message;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
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
