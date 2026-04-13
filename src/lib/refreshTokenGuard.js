let refreshInFlight = null;
let refreshBlockedUntil = 0;

const DEFAULT_BACKOFF_MS = 30_000;
const REFRESH_BACKOFF_MS = Number(import.meta.env.VITE_REFRESH_BACKOFF_MS) || DEFAULT_BACKOFF_MS;

export const runRefreshWithBackoff = async (refreshFn) => {
  const now = Date.now();
  if (now < refreshBlockedUntil) {
    const error = new Error("Refresh temporarily blocked after recent failure");
    error.code = "REFRESH_BACKOFF";
    throw error;
  }

  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      await refreshFn();
      refreshBlockedUntil = 0;
    } catch (error) {
      refreshBlockedUntil = Date.now() + REFRESH_BACKOFF_MS;
      throw error;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
};
