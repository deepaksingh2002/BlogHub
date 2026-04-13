import axios from "axios";

const AUTH_SESSION_STORAGE_KEY = "bloghub_auth_session";

const readStoredSession = () => {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null };
  }

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return { accessToken: null, refreshToken: null };

    const parsed = JSON.parse(raw);
    return {
      accessToken: typeof parsed?.accessToken === "string" ? parsed.accessToken : null,
      refreshToken: typeof parsed?.refreshToken === "string" ? parsed.refreshToken : null,
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
};

const writeStoredSession = (session) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage failures.
  }
};

export const getStoredAccessToken = () => readStoredSession().accessToken;

export const getStoredRefreshToken = () => readStoredSession().refreshToken;

export const setStoredAuthTokens = ({ accessToken = null, refreshToken = null } = {}) => {
  const current = readStoredSession();
  const next = {
    accessToken: accessToken ?? current.accessToken ?? null,
    refreshToken: refreshToken ?? current.refreshToken ?? null,
  };

  if (!next.accessToken && !next.refreshToken) {
    clearStoredAuthTokens();
    return;
  }

  writeStoredSession(next);
};

export const clearStoredAuthTokens = () => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
};

export const buildAuthHeaders = (headers = {}) => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) return headers;

  return {
    ...headers,
    Authorization: `Bearer ${accessToken}`,
  };
};

export const attachAuthHeaderInterceptor = (client) => {
  client.interceptors.request.use((config) => ({
    ...config,
    headers: buildAuthHeaders(config.headers || {}),
  }));

  return client;
};

export const createAuthClient = ({ baseURL, timeout }) =>
  attachAuthHeaderInterceptor(
    axios.create({
      baseURL,
      withCredentials: true,
      timeout,
    })
  );

export const buildRefreshPayload = (payload = {}) => {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return payload;

  return {
    ...payload,
    refreshToken,
  };
};

export const extractAuthTokens = (payload = {}) => {
  const session = payload?.data && typeof payload.data === "object" ? payload.data : payload;

  return {
    accessToken: typeof session?.accessToken === "string" ? session.accessToken : null,
    refreshToken: typeof session?.refreshToken === "string" ? session.refreshToken : null,
  };
};

export const storeAuthTokensFromResponse = (response) => {
  const tokens = extractAuthTokens(response?.data ?? response);
  if (tokens.accessToken || tokens.refreshToken) {
    setStoredAuthTokens(tokens);
  }

  return tokens;
};

export const refreshSessionTokens = async (refreshRequest) => {
  const response = await refreshRequest();
  storeAuthTokensFromResponse(response);
  return response;
};