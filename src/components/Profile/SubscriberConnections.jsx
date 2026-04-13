import React from "react";

const getAvatarUrl = (person) =>
  person?.avatar?.url ||
  person?.avatar ||
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const ConnectionsCard = ({ title, count, people, emptyMessage, accentClassName }) => {
  return (
    <div className="h-full rounded-2xl border border-beige bg-background p-4 dark:border-light/20 dark:bg-background">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-dark/70 dark:text-light/80">{title}</p>
        <span className={`text-[11px] font-medium ${accentClassName || "text-dark/55 dark:text-light/70"}`}>
          {count}
        </span>
      </div>

      <div className="mt-4 space-y-2 max-h-72 overflow-auto pr-1">
        {people.length ? (
          people.map((person) => (
            <div
              key={person?._id || person?.id || person?.username}
              className="grid grid-cols-[auto,1fr,auto] items-center gap-3 rounded-xl border border-beige bg-light px-3 py-2 dark:border-light/20 dark:bg-background"
            >
              <img
                src={getAvatarUrl(person)}
                alt={person?.fullName || person?.username || "User"}
                className="h-10 w-10 rounded-xl object-cover border border-beige dark:border-light/20"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-dark dark:text-light">
                  {person?.fullName || person?.username || "User"}
                </p>
                <p className="truncate text-xs text-dark/60 dark:text-light/70">
                  @{person?.username || "unknown"}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary dark:bg-primary/20">
                {String(person?.role || "author").toLowerCase() === "author" ? "Author" : "User"}
              </span>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-beige px-4 py-6 text-center text-sm text-dark/60 dark:border-light/20 dark:text-light/70">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  );
};

function SubscriberConnections({ following = [], followers = [] }) {
  return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <ConnectionsCard
          title="Following"
          count={following.length}
          people={following}
          emptyMessage="You are not following any authors yet."
          accentClassName="text-primary"
        />
        <ConnectionsCard
          title="Followers"
          count={followers.length}
          people={followers}
          emptyMessage="No followers yet."
          accentClassName="text-secondary"
        />
      </div>
  );
}

export default React.memo(SubscriberConnections);