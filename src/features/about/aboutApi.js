import axios from "axios";

const API = import.meta.env.VITE_API_URL || "";

const aboutApi = axios.create({
  baseURL: `${API}/api/v1/about`,
  withCredentials: true,
  timeout: 30000,
});

const refreshApi = axios.create({
  baseURL: `${API}/api/v1/users`,
  withCredentials: true,
  timeout: 10000,
});

const refreshAccessToken = async () => {
  await refreshApi.post("/refresh-token", {});
};

const toSafeString = (value) => (typeof value === "string" ? value : "");


export const defaultAboutProfile = {
  fullName: "",
  headline: "",
  summary: "",
  location: "",
  email: "",
  phone: "",
  skills: "",
  experience: "",
  education: "",
  resumeUrl: "",
  updatedAt: null,
  id: "",
};

export const normalizeAboutProfile = (payload = {}) => {
  const base =
    payload?.about ||
    payload?.aboutProfile ||
    payload?.aboutData ||
    payload?.profile ||
    payload?.data?.about ||
    payload?.data?.aboutProfile ||
    payload?.data?.aboutData ||
    payload?.data?.profile ||
    payload?.data ||
    payload;

  const resumeUrl =
    base?.resumeUrl ||
    base?.resume?.url ||
    base?.resume?.downloadUrl ||
    "";

  return {
    ...defaultAboutProfile,
    id: toSafeString(base?._id || base?.id || base?.aboutId).trim(),
    fullName: toSafeString(base?.fullName).trim(),
    headline: toSafeString(base?.headline).trim(),
    summary: toSafeString(base?.summary).trim(),
    location: toSafeString(base?.location).trim(),
    email: toSafeString(base?.email).trim(),
    phone: toSafeString(base?.phone).trim(),
    skills: Array.isArray(base?.skills)
      ? base.skills.join(", ")
      : toSafeString(base?.skills).trim(),
    experience: Array.isArray(base?.experience)
      ? base.experience.join("\n")
      : toSafeString(base?.experience).trim(),
    education: Array.isArray(base?.education)
      ? base.education.join("\n")
      : toSafeString(base?.education).trim(),
    resumeUrl: toSafeString(resumeUrl).trim(),
    updatedAt: base?.updatedAt || base?.createdAt || null,
  };
};

const hasProfileData = (profile) =>
  Boolean(
    profile?.fullName ||
      profile?.headline ||
      profile?.summary ||
      profile?.location ||
      profile?.email ||
      profile?.phone ||
      profile?.skills ||
      profile?.experience ||
      profile?.education ||
      profile?.resumeUrl ||
      profile?.updatedAt
  );

const normalizeError = (error) => {
  const data = error?.response?.data || null;
  return {
    code: error?.code || null,
    statusCode: error?.response?.status || null,
    message: data?.message || error?.message || "Request failed",
    fieldErrors: data?.errors || data?.fieldErrors || data?.validationErrors || null,
    data,
  };
};

aboutApi.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error?.config;
    if (!originalRequest) return Promise.reject(normalizeError(error));

    const isRefreshCall = originalRequest.url?.includes("/refresh-token");
    if (isRefreshCall || originalRequest.skipAuthRefresh) {
      return Promise.reject(normalizeError(error));
    }

    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await refreshAccessToken();
        return aboutApi(originalRequest);
      } catch (refreshError) {
        return Promise.reject(normalizeError(refreshError));
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

const getResumeDownloadUrl = () =>
  import.meta.env.VITE_ABOUT_RESUME_DOWNLOAD_URL || `${API}/api/v1/about/resume/download`;

const getResumePreviewUrl = () =>
  import.meta.env.VITE_ABOUT_RESUME_PREVIEW_URL || `${API}/api/v1/about/resume/preview`;

const resumeEndpointCandidates = {
  base: ["/resume", "/aboutMe/resume"],
  preview: ["/resume/preview", "/aboutMe/resume/preview"],
  download: ["/resume/download", "/aboutMe/resume/download"],
};

const extractResumeUrl = (payload = {}) => {
  return (
    payload?.url ||
    payload?.data?.url ||
    payload?.resumeUrl ||
    payload?.data?.resumeUrl ||
    payload?.data?.file?.url ||
    payload?.file?.url ||
    ""
  );
};

export const aboutService = {
  async getAboutProfile() {
    try {
      const response = await aboutApi.get("/", { skipAuthRefresh: true });
      return normalizeAboutProfile(response);
    } catch (error) {
      if (Number(error?.statusCode || 0) === 404) {
        return defaultAboutProfile;
      }
      throw error;
    }
  },

  async getAboutForDashboard() {
    try {
      const response = await aboutApi.get("/dashboard");
      return normalizeAboutProfile(response);
    } catch (error) {
      if (Number(error?.statusCode || 0) === 404) {
        return defaultAboutProfile;
      }
      throw error;
    }
  },

  async updateAboutProfile(payload) {
    const methods = ["patch", "put", "post"];
    let lastError;

    for (const method of methods) {
      try {
        const response = await aboutApi[method]("/", payload);
        const profile = normalizeAboutProfile(response);
        if (hasProfileData(profile)) return profile;
        return this.getAboutForDashboard();
      } catch (error) {
        lastError = error;
        const status = Number(error?.statusCode || 0);
        if (status !== 404 && status !== 405) break;
      }
    }

    throw lastError || new Error("Failed to update About profile.");
  },

  async uploadResume(file, onProgress) {
    const formData = new FormData();
    formData.append("resume", file);
    const methods = ["post", "put"];
    let lastError = null;

    for (const path of resumeEndpointCandidates.base) {
      for (const method of methods) {
        try {
          const response = await aboutApi[method](path, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (event) => {
              if (!event?.total || typeof onProgress !== "function") return;
              const percent = Math.round((event.loaded * 100) / event.total);
              onProgress(percent);
            },
          });

          const profile = normalizeAboutProfile(response);
          if (hasProfileData(profile)) return profile;
          return this.getAboutForDashboard();
        } catch (error) {
          lastError = error;
          const status = Number(error?.statusCode || 0);
          if (status !== 404 && status !== 405) break;
        }
      }
    }

    throw lastError || new Error("Failed to upload resume.");
  },

  async deleteResume() {
    let lastError = null;
    for (const path of resumeEndpointCandidates.base) {
      try {
        await aboutApi.delete(path);
        return true;
      } catch (error) {
        lastError = error;
        const status = Number(error?.statusCode || 0);
        if (status !== 404 && status !== 405) break;
      }
    }

    throw lastError || new Error("Failed to delete resume.");
  },

  async resolveResumePreviewFileUrl() {
    let lastError = null;
    for (const path of resumeEndpointCandidates.preview) {
      try {
        const response = await aboutApi.get(path, { skipAuthRefresh: true });
        const resolvedUrl = extractResumeUrl(response);
        return resolvedUrl || getResumePreviewUrl();
      } catch (error) {
        lastError = error;
        const status = Number(error?.statusCode || 0);
        if (status !== 404 && status !== 405) break;
      }
    }

    throw lastError || new Error("Failed to resolve resume preview URL.");
  },

  async resolveResumeDownloadFileUrl() {
    let lastError = null;
    for (const path of resumeEndpointCandidates.download) {
      try {
        const response = await aboutApi.get(path, { skipAuthRefresh: true });
        const resolvedUrl = extractResumeUrl(response);
        return resolvedUrl || getResumeDownloadUrl();
      } catch (error) {
        lastError = error;
        const status = Number(error?.statusCode || 0);
        if (status !== 404 && status !== 405) break;
      }
    }

    throw lastError || new Error("Failed to resolve resume download URL.");
  },

  getResumePreviewUrl,
  getResumeDownloadUrl,
};

export default aboutService;
