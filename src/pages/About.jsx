import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Container } from "../components";
import { aboutService } from "../features/about/aboutApi";
import {
  useDeleteResumeMutation,
  useResumeLinksQuery,
  useUploadResumeMutation,
} from "../features/about/useAboutQueries";
import { selectAuthUser, selectIsAuthenticated } from "../features/auth/authSlice";
import { isRoleAllowed } from "../utils/roleHelpers";

const buildFirstPageViewUrl = (url) => {
  if (!url) return "";
  const hashPart = "page=1&zoom=page-fit&view=FitH&toolbar=0&navpanes=0&scrollbar=0";
  return url.includes("#") ? `${url}&${hashPart}` : `${url}#${hashPart}`;
};

const getResumeFileName = (url) => {
  try {
    const clean = (url || "").split("#")[0].split("?")[0];
    const part = clean.split("/").pop() || "resume.pdf";
    return decodeURIComponent(part);
  } catch {
    return "resume.pdf";
  }
};

function About() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authUser = useSelector(selectAuthUser);
  const canManageResume = isRoleAllowed(authUser, ["admin", "superadmin"]);
  const resumeLinksQuery = useResumeLinksQuery();
  const uploadResumeMutation = useUploadResumeMutation();
  const deleteResumeMutation = useDeleteResumeMutation();
  const [previewUrl, setPreviewUrl] = useState(aboutService.getResumePreviewUrl());
  const [downloadUrl, setDownloadUrl] = useState(aboutService.getResumeDownloadUrl());
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const firstPagePreviewUrl = buildFirstPageViewUrl(previewUrl);
  const resumeFileName = getResumeFileName(downloadUrl || previewUrl);

  useEffect(() => {
    if (resumeLinksQuery.data?.previewUrl) {
      setPreviewUrl(resumeLinksQuery.data.previewUrl);
    }
    if (resumeLinksQuery.data?.downloadUrl) {
      setDownloadUrl(resumeLinksQuery.data.downloadUrl);
    }
  }, [resumeLinksQuery.data]);

  const refreshResumeUrls = async () => {
    const result = await resumeLinksQuery.refetch();
    if (result.data?.previewUrl) setPreviewUrl(result.data.previewUrl);
    if (result.data?.downloadUrl) setDownloadUrl(result.data.downloadUrl);
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setErrorMessage("Only PDF files are allowed.");
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMessage("Resume file size must be 5MB or less.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await uploadResumeMutation.mutateAsync({ file, onProgress: setUploadProgress });
      await refreshResumeUrls();
      setStatusMessage("Resume uploaded/updated successfully.");
    } catch (error) {
      if (error?.statusCode === 401) {
        navigate("/login");
        return;
      }
      if (error?.statusCode === 403) {
        setErrorMessage("Access denied. Only owner/developer can manage resume.");
        return;
      }
      setErrorMessage(error?.message || "Resume upload failed.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteResume = async () => {
    if (!window.confirm("Delete the current resume PDF?")) return;

    setDeleting(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await deleteResumeMutation.mutateAsync();
      setPreviewUrl(aboutService.getResumePreviewUrl());
      setDownloadUrl(aboutService.getResumeDownloadUrl());
      setStatusMessage("Resume deleted successfully.");
    } catch (error) {
      if (error?.statusCode === 401) {
        navigate("/login");
        return;
      }
      if (error?.statusCode === 403) {
        setErrorMessage("Access denied. Only owner/developer can delete resume.");
        return;
      }
      setErrorMessage(error?.message || "Failed to delete resume.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-16 bg-background dark:bg-background">
      <Container>
        <div className="max-w-6xl mx-auto space-y-6">
          <section className="rounded-[1.6rem] border border-beige bg-light shadow-[0_24px_60px_-40px_rgba(30,41,59,0.25)] dark:bg-background dark:border-light/20 overflow-hidden">
            <div className="px-6 sm:px-8 pt-6 sm:pt-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  {/* <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-primary">Recruiter Profile</p> */}
                  <h1 className="mt-2 text-3xl sm:text-5xl font-black text-dark dark:text-light">
                    Deepak Singh
                  </h1>
                  <p className="mt-2 text-base sm:text-lg font-semibold text-primary dark:text-primary">Freelance MERN Stack Developer</p>
                  <p className="mt-2 max-w-3xl text-sm sm:text-base leading-relaxed text-dark/80 dark:text-light/80">
                    I am actively seeking freelance opportunities for modern web development projects. I build scalable full-stack applications with MongoDB, Express, React, and Node.js, and I focus on clean UI, secure APIs, and reliable delivery.
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center rounded-full border border-beige bg-background px-3 py-1 text-xs font-semibold text-dark/80 dark:bg-background dark:border-light/20 dark:text-light/80">
                  Available for Freelance Work
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-beige bg-background px-6 sm:px-8 py-3 dark:bg-background dark:border-light/20">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-dark/80 dark:text-light/80">
                <span>{`Contact me:`}</span>
                <span>{`✉  deepakksingh1202@gmail.com`}</span>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] text-dark/70 dark:text-light/80">Resume Preview - First Page</span>
                <span className="h-px flex-1 bg-beige dark:bg-light/20" />
              </div>

              <div className="rounded-2xl overflow-hidden border border-beige bg-background shadow-[inset_0_0_80px_rgba(255,255,255,0.03)] dark:border-light/20">
                <div className="h-9 px-3 flex items-center justify-between bg-light border-b border-beige dark:bg-background dark:border-light/20">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-primary/50" />
                    <span className="ml-2 text-[11px] text-dark/80 dark:text-light/80 truncate max-w-[180px] sm:max-w-[260px]">{resumeFileName}</span>
                  </div>
                  <span className="text-[11px] text-dark/70 dark:text-light/80">Page 1 of 1</span>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="relative mx-auto aspect-210/297 w-full max-w-[560px] rounded-lg overflow-hidden border border-beige bg-white">
                    <iframe
                      title="Resume First Page Preview"
                      src={firstPagePreviewUrl}
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>
                </div>
              </div>

              
            </div>

            <div className="border-t border-beige bg-background px-6 sm:px-8 py-4 dark:bg-background dark:border-light/20">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-xl border border-beige bg-background px-4 py-2 text-sm font-semibold text-dark hover:bg-light dark:bg-background dark:border-light/20 dark:text-light dark:hover:bg-background"
                >
                  Open Preview
                </a>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
                >
                  Download PDF
                </a>

                {isAuthenticated && canManageResume && (
                  <>
                    <label className="inline-flex cursor-pointer items-center rounded-xl border border-beige bg-background px-4 py-2 text-sm font-semibold text-dark hover:bg-light dark:bg-background dark:border-light/20 dark:text-light dark:hover:bg-background">
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={handleResumeUpload}
                        disabled={uploading || deleting}
                      />
                      {uploading ? `Uploading ${uploadProgress}%` : "Upload / Replace"}
                    </label>
                    <button
                      type="button"
                      onClick={handleDeleteResume}
                      disabled={uploading || deleting}
                      className="inline-flex items-center rounded-xl border border-warning/30 bg-light px-4 py-2 text-sm font-semibold text-warning hover:bg-background disabled:opacity-60 dark:border-warning/40 dark:bg-background dark:text-warning dark:hover:bg-background"
                    >
                      {deleting ? "Deleting..." : "Delete PDF"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>

          {errorMessage && canManageResume && (
            <p className="rounded-xl border border-warning/30 bg-light px-4 py-3 text-sm font-medium text-warning dark:border-warning/40 dark:bg-background dark:text-warning">
              {errorMessage}
            </p>
          )}
          {statusMessage && canManageResume && (
            <p className="rounded-xl border border-secondary/30 bg-light px-4 py-3 text-sm font-medium text-secondary dark:border-secondary/40 dark:bg-background dark:text-secondary">
              {statusMessage}
            </p>
          )}
        </div>

      </Container>
    </div>
  );
}

export default React.memo(About);
