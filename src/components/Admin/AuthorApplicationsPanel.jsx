import React from "react";
import { HiOutlineCheckCircle } from "react-icons/hi2";
import Button from "../Button";

function AuthorApplicationsPanel({
  loading,
  applications,
  processingUserId,
  rejectReasonByUser,
  setRejectReasonByUser,
  onApprove,
  onReject,
}) {
  return (
    <article className="rounded-3xl border border-beige bg-light p-5 sm:p-6 dark:bg-background dark:border-light/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-dark dark:text-light">Pending Author Applications</h2>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-background text-warning dark:bg-background dark:text-warning">
          {applications.length} pending
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-dark/70 dark:text-light/80">Loading applications...</p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-dark/70 dark:text-light/80">No pending applications right now.</p>
      ) : (
        <div className="space-y-4">
          {applications.map((application, index) => {
            const userId =
              application?.userId ||
              application?._id ||
              application?.user?._id ||
              application?.id ||
              String(index);
            const displayName =
              application?.fullName ||
              application?.name ||
              application?.user?.fullName ||
              application?.user?.name ||
              "Applicant";
            const displayEmail = application?.email || application?.user?.email || "";
            const isProcessing = processingUserId === userId;

            return (
              <div key={userId} className="rounded-2xl border border-beige bg-background p-4 dark:bg-background dark:border-light/20">
                <p className="text-sm font-bold text-dark dark:text-light">{displayName}</p>
                {displayEmail && <p className="text-xs text-dark/70 dark:text-light/80">{displayEmail}</p>}

                <textarea
                  value={rejectReasonByUser[userId] || ""}
                  onChange={(event) =>
                    setRejectReasonByUser((prev) => ({
                      ...prev,
                      [userId]: event.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="Reason (only needed for reject)"
                  className="mt-3 w-full rounded-xl border border-beige bg-light px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-light/20 dark:bg-background dark:text-light"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => onApprove(userId)}
                    disabled={isProcessing}
                    bgColor="bg-secondary"
                    textColor="text-white"
                    className="inline-flex items-center gap-1 rounded-xl hover:bg-secondary/90 disabled:opacity-60 text-xs sm:text-sm font-semibold"
                  >
                    <HiOutlineCheckCircle className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    type="button"
                    onClick={() => onReject(userId)}
                    disabled={isProcessing}
                    bgColor="bg-warning"
                    textColor="text-white"
                    className="inline-flex items-center gap-1 rounded-xl hover:bg-warning/90 disabled:opacity-60 text-xs sm:text-sm font-semibold"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

export default React.memo(AuthorApplicationsPanel);
