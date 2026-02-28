import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Contaner } from "../components";
import { aboutService } from "../features/about/aboutApi";
import { selectIsAuthenticated } from "../features/auth/authSlice";

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
    let mounted = true;

    const resolveResumeLinks = async () => {
      try {
        const [resolvedPreviewUrl, resolvedDownloadUrl] = await Promise.all([
          aboutService.resolveResumePreviewFileUrl(),
          aboutService.resolveResumeDownloadFileUrl(),
        ]);
        if (!mounted) return;
        if (resolvedPreviewUrl) setPreviewUrl(resolvedPreviewUrl);
        if (resolvedDownloadUrl) setDownloadUrl(resolvedDownloadUrl);
      } catch {
        // Keep API-route fallback links.
      }
    };

    resolveResumeLinks();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshResumeUrls = async () => {
    const [resolvedPreviewUrl, resolvedDownloadUrl] = await Promise.all([
      aboutService.resolveResumePreviewFileUrl(),
      aboutService.resolveResumeDownloadFileUrl(),
    ]);
    if (resolvedPreviewUrl) setPreviewUrl(resolvedPreviewUrl);
    if (resolvedDownloadUrl) setDownloadUrl(resolvedDownloadUrl);
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
      await aboutService.uploadResume(file, setUploadProgress);
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
      await aboutService.deleteResume();
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
    <div className="min-h-screen pt-32 pb-16 bg-[linear-gradient(120deg,#fff7ed_0%,#fffbeb_30%,#f8fafc_70%,#eef2ff_100%)] dark:bg-[linear-gradient(120deg,#0b1220_0%,#0f172a_30%,#111827_70%,#0b1220_100%)]">
      <Contaner>
        <div className="max-w-6xl mx-auto space-y-6">
          <section className="rounded-[1.6rem] border border-[#d7d0c2] bg-[#f7f4ee] shadow-[0_24px_60px_-40px_rgba(30,41,59,0.45)] dark:bg-slate-900 dark:border-slate-700 overflow-hidden">
            <div className="px-6 sm:px-8 pt-6 sm:pt-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  {/* <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-[#c15a2a]">Recruiter Profile</p> */}
                  <h1 className="mt-2 text-3xl sm:text-5xl font-black text-[#1f2937] dark:text-slate-100">
                    Deepak Singh
                  </h1>
                  <p className="mt-2 text-base sm:text-lg font-semibold text-[#d9481f] dark:text-orange-300">Fresher - MERN Stack Developer</p>
                  <p className="mt-2 max-w-3xl text-sm sm:text-base leading-relaxed text-[#4b5563] dark:text-slate-300">
                    Passionate and self-driven MERN stack developer with hands-on experience building full-stack web applications through academic projects and internships. Eager to contribute, learn fast, and grow in a collaborative engineering team.
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center rounded-full border border-[#d9d0bf] bg-[#f3eee3] px-3 py-1 text-xs font-semibold text-[#5a5447] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                  Recruiter View
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-[#dbd3c6] bg-[#efe8db] px-6 sm:px-8 py-3 dark:bg-slate-800/70 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-[#5d584d] dark:text-slate-300">
                <span>{`✉  deepakksingh1202@gmail.com`}</span>
                <span>{`💼  Applied: Junior MERN Developer - Remote / Hybrid`}</span>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] text-[#6b7280] dark:text-slate-300">Resume Preview - First Page</span>
                <span className="h-px flex-1 bg-[#d4cdc0] dark:bg-slate-700" />
              </div>

              <div className="rounded-2xl overflow-hidden border border-[#2f3340] bg-[#1f2128] shadow-[inset_0_0_80px_rgba(255,255,255,0.03)]">
                <div className="h-9 px-3 flex items-center justify-between bg-[#12141a] border-b border-[#333946]">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                    <span className="ml-2 text-[11px] text-slate-300 truncate max-w-[180px] sm:max-w-[260px]">{resumeFileName}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Page 1 of 1</span>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="relative mx-auto aspect-[210/297] w-full max-w-[560px] rounded-lg overflow-hidden border border-[#4b5563] bg-white">
                    <iframe
                      title="Resume First Page Preview"
                      src={firstPagePreviewUrl}
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-amber-300/70 bg-amber-50/70 px-4 py-2 text-xs sm:text-sm text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300">
                Optimized first-page resume view for fast screening. Click <span className="font-semibold">Open Preview</span> to review the complete document.
              </div>
            </div>

            <div className="border-t border-[#d8d0c1] bg-[#f2ecdf] px-6 sm:px-8 py-4 dark:bg-slate-800/60 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-xl border border-[#cfc6b6] bg-white px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-[#faf8f3] dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Open Preview
                </a>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-xl bg-[#d14d27] px-4 py-2 text-sm font-semibold text-white hover:bg-[#bf3f1a]"
                >
                  Download PDF
                </a>

                {isAuthenticated && (
                  <>
                    <label className="inline-flex cursor-pointer items-center rounded-xl border border-[#cfc6b6] bg-white px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-[#faf8f3] dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
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
                      className="inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
                    >
                      {deleting ? "Deleting..." : "Delete PDF"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>

          {errorMessage && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
              {errorMessage}
            </p>
          )}
          {statusMessage && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              {statusMessage}
            </p>
          )}
        </div>

      </Contaner>
    </div>
  );
}

export default React.memo(About);
