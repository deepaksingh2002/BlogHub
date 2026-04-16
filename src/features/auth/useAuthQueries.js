import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { AuthService } from "./authApi";
import {
  clearStoredAuthTokens,
  extractAuthTokens,
  setStoredAuthTokens,
} from "./authSession";
import {
  clearAuthSession,
  selectAuthUser,
  setAuthChecked,
  setAuthSession,
} from "./authSlice";
import { authorService } from "../author/authorApi";

const parseUser = (payload) => {
  if (!payload) return null;

  // If payload looks like a user object (has _id, email, username), return as is
  if (
    typeof payload === "object" &&
    (payload._id || payload.id) &&
    (payload.email || payload.username || payload.fullName)
  ) {
    return payload;
  }

  return (
    payload.user ||
    payload.currentUser ||
    payload.loggedInUser ||
    payload.userData ||
    payload.profile ||
    payload.admin ||
    payload.author ||
    payload.data?.user ||
    payload.data?.currentUser ||
    payload.data?.loggedInUser ||
    payload.data?.userData ||
    payload.data?.profile ||
    payload.data?.admin ||
    payload.data?.author ||
    payload.data ||
    null
  );
};

const getStatusCode = (error) =>
  error?.response?.status || error?.statusCode || null;

const isAuthorUser = (user) => String(user?.role || "").toLowerCase() === "author";

export const useBootstrapCurrentUserQuery = (enabled = true) => {
  return useBootstrapCurrentUserQueryWithOptions(enabled, { clearOn401: true });
};

const useBootstrapCurrentUserQueryWithOptions = (
  enabled = true,
  { clearOn401 = true } = {}
) => {
  const dispatch = useDispatch();

  const query = useQuery({
    queryKey: ["auth", "currentUser"],
    enabled,
    queryFn: async () => {
      const response = await AuthService.currentUser();
      return response.data;
    },
    retry: false,
  });

  useEffect(() => {
    if (query.isSuccess) {
      dispatch(setAuthSession({ user: parseUser(query.data) }));
      setStoredAuthTokens(extractAuthTokens(query.data));
    }
  }, [dispatch, query.data, query.isSuccess]);

  useEffect(() => {
    if (!query.isError) return;

    if (getStatusCode(query.error) === 401) {
      clearStoredAuthTokens();
      if (clearOn401) {
        dispatch(clearAuthSession());
      } else {
        dispatch(setAuthChecked(true));
      }
      return;
    }

    dispatch(setAuthChecked(true));
  }, [dispatch, query.error, query.isError]);

  return query;
};

export const useBootstrapCurrentUserQuerySafe = (enabled = true) =>
  useBootstrapCurrentUserQueryWithOptions(enabled, { clearOn401: false });

export const useLoginMutation = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials) => {
      const response = await AuthService.login(credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      dispatch(setAuthSession({ user: parseUser(data) }));
      setStoredAuthTokens(extractAuthTokens(data));
      await queryClient.invalidateQueries({ queryKey: ["auth", "currentUser"] });
    },
  });
};

export const useSignupMutation = () => {
  const loginMutation = useLoginMutation();

  return useMutation({
    mutationFn: async ({ fullName, email, password }) => {
      await AuthService.register({ fullName, email, password });
      return loginMutation.mutateAsync({ email, password });
    },
  });
};

export const useLogoutMutation = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload = {}) => {
      try {
        await AuthService.logout(payload);
      } catch {
        // Clear local session even when logout endpoint fails.
      }
    },
    onSuccess: async () => {
      dispatch(clearAuthSession());
      clearStoredAuthTokens();
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
};

export const useForgotPasswordMutation = () =>
  useMutation({
    mutationFn: async ({ email }) => {
      const response = await AuthService.forgotPassword({ email });
      return response.data;
    },
  });

export const useUserProfileQuery = (enabled = true) => {
  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);
  const useAuthorProfileEndpoint = isAuthorUser(user);

  const query = useQuery({
    queryKey: ["auth", "profile", useAuthorProfileEndpoint ? "author" : "user"],
    enabled,
    queryFn: async () => {
      if (useAuthorProfileEndpoint) {
        return authorService.getProfile();
      }

      const response = await AuthService.getUserProfile();
      return response.data;
    },
    retry: false,
  });

  useEffect(() => {
    if (!query.isSuccess) return;
    dispatch(setAuthSession({ user: parseUser(query.data) }));
  }, [dispatch, query.data, query.isSuccess]);

  return query;
};

const createAuthMutation = (mutationFn) => {
  return () => {
    const dispatch = useDispatch();

    return useMutation({
      mutationFn,
      onSuccess: (data) => {
        const user = parseUser(data);
        if (user) {
          dispatch(setAuthSession({ user }));
        }
        setStoredAuthTokens(extractAuthTokens(data));
      },
    });
  };
};

export const useUpdateUserProfileMutation = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);

  return useMutation({
    mutationFn: async (payload) => {
      if (isAuthorUser(user)) {
        return authorService.updateProfile(payload);
      }

      const response = await AuthService.updateUserProfile(null, payload);
      return response.data;
    },
    onSuccess: (data) => {
      const updatedUser = parseUser(data);
      if (updatedUser) {
        dispatch(setAuthSession({ user: updatedUser }));
      }
      setStoredAuthTokens(extractAuthTokens(data));
    },
  });
};

export const useUpdateUserAvatarMutation = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);

  return useMutation({
    mutationFn: async (formData) => {
      if (isAuthorUser(user)) {
        return authorService.updateProfile(formData);
      }

      const response = await AuthService.updateUserAvatar(null, formData);
      return response.data;
    },
    onSuccess: (data) => {
      const updatedUser = parseUser(data);
      if (updatedUser) {
        dispatch(setAuthSession({ user: updatedUser }));
      }
      setStoredAuthTokens(extractAuthTokens(data));
    },
  });
};

export const useChangePasswordMutation = () =>
  useMutation({
    mutationFn: async (payload) => {
      const response = await AuthService.changeUserPassword(null, payload);
      return response.data;
    },
  });

export const useApplyForAuthorMutation = createAuthMutation(async (payload) => {
  const response = await AuthService.applyForAuthor(payload);
  return response.data;
});
