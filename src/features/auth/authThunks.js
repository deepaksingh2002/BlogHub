import { createAsyncThunk } from "@reduxjs/toolkit";
import { AuthService } from "./authApi";

const handleError = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong";

export const registerUser = createAsyncThunk(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      const res = await AuthService.register(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const res = await AuthService.login(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const res = await AuthService.logout();
      return res.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  "auth/currentUser",
  async (_, { rejectWithValue }) => {
    try {
      // Allow interceptor-driven refresh so sessions survive reload/reopen.
      const res = await AuthService.currentUser();
      return res.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const getUserProfile = createAsyncThunk(
  "auth/profile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await AuthService.getUserProfile();
      return res.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateProfile",
  async (data, { rejectWithValue }) => {
    try {
      const res = await AuthService.updateUserProfile(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const updateUserAvatar = createAsyncThunk(
  "auth/updateAvatar",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await AuthService.updateUserAvatar(formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const changeUserPassword = createAsyncThunk(
  "auth/changePassword",
  async (data, { rejectWithValue }) => {
    try {
      const res = await AuthService.changeUserPassword(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);
