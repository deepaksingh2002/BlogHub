import React, { useMemo } from "react";

const getAvatarUrl = (person) =>
  person?.avatar?.url ||
  person?.avatar ||
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const ConnectionsCard = ({ title, count, people, emptyMessage, accentClassName }) => {

  return (
    <div className="group relative flex h-full min-h-[28rem] flex-col overflow-hidden rounded-3xl border border-beige bg-background p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-light/20 dark:bg-background">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent opacity-80" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-xl font-black text-dark dark:text-light">{title}</h3>
        </div>
        <div className="shrink-0 text-right">
          <span className={`inline-flex min-w-14 justify-center rounded-full bg-light px-3 py-1 text-sm font-black text-dark dark:bg-background dark:text-light ${accentClassName || ""}`}>
            {count}
          </span>
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-2 overflow-auto pr-1">
        {people.length ? (
          people.map((person) => (
            <div
              key={person?._id || person?.id || person?.username}
              className="flex items-center gap-3 rounded-2xl border border-beige bg-light px-4 py-3 shadow-sm transition hover:border-primary/30 hover:bg-background dark:border-light/20 dark:bg-background dark:hover:border-primary/30"
            >
              <img
                src={getAvatarUrl(person)}
                alt={person?.fullName || person?.username || "User"}
                className="h-12 w-12 rounded-2xl object-cover border border-beige shadow-sm dark:border-light/20 shrink-0"
              />

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-sm font-bold text-dark dark:text-light">
                    {person?.fullName || person?.username || "User"}
                  </p>
                  {person?.email ? (
                    <span className="hidden sm:inline-flex shrink-0 rounded-full border border-beige bg-background px-2 py-0.5 text-[11px] font-semibold text-dark/60 dark:border-light/20 dark:bg-background dark:text-light/65">
                      {person.email}
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-dark/60 dark:text-light/70">
                  @{person?.username || "unknown"}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary dark:bg-primary/20">
                {String(person?.role || "author").toLowerCase() === "author" ? "Author" : "User"}
              </span>
            </div>
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="w-full rounded-2xl border border-dashed border-beige px-4 py-10 text-center text-sm text-dark/60 dark:border-light/20 dark:text-light/70">
              {emptyMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

function SubscriberConnections({ following = [], followers = [], searchTerm = "" }) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredFollowing = useMemo(() => {
    if (!normalizedSearch) return following;
    return following.filter((person) => {
      const haystack = [person?.fullName, person?.username, person?.email, person?.role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [following, normalizedSearch]);

  const filteredFollowers = useMemo(() => {
    if (!normalizedSearch) return followers;
    return followers.filter((person) => {
      const haystack = [person?.fullName, person?.username, person?.email, person?.role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [followers, normalizedSearch]);

  return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        <ConnectionsCard
          title="Following"
          count={filteredFollowing.length}
          people={filteredFollowing}
          emptyMessage="You are not following any authors yet."
          accentClassName="text-primary"
        />
        <ConnectionsCard
          title="Followers"
          count={filteredFollowers.length}
          people={filteredFollowers}
          emptyMessage="No followers yet."
          accentClassName="text-secondary"
        />
      </div>
  );
}

export default React.memo(SubscriberConnections);