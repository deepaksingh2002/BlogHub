import { createSlice } from "@reduxjs/toolkit";

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
  isAuthenticated: Boolean(persistedUser),
  authChecked: false, 
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthSession: (state, action) => {
      const incoming = action.payload?.user ?? action.payload ?? null;
      state.user = incoming;
      state.isAuthenticated = Boolean(incoming);
      state.authChecked = true;
      persistUser(state.user);
    },
    clearAuthSession: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.authChecked = true;
      persistUser(null);
    },
    setAuthChecked: (state, action) => {
      state.authChecked = Boolean(action.payload);
    },
  },
});

export const { setAuthSession, clearAuthSession, setAuthChecked } = authSlice.actions;
export default authSlice.reducer;

export const selectAuthUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthChecked = (state) => state.auth.authChecked;
