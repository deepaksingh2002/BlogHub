import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Container } from "../components";
import SubscriberConnections from "../components/Profile/SubscriberConnections";
import { selectAuthUser } from "../features/auth/authSlice";
import { useAuthorsListQuery, useFollowersListQuery } from "../features/subscription/useSubscriptionQueries";

const getUserId = (user) => user?._id || user?.id || user?.userId || user?.data?._id || null;

function SubscriberConnectionsPage() {
  const user = useSelector(selectAuthUser);
  const currentUserId = getUserId(user);
  const [searchTerm, setSearchTerm] = useState("");

  const authorsQuery = useAuthorsListQuery(Boolean(user));
  const followersQuery = useFollowersListQuery(currentUserId, Boolean(currentUserId));

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const following = useMemo(() => {
    const authors = Array.isArray(authorsQuery.data) ? authorsQuery.data : [];
    return authors.filter((author) => {
      const role = String(author?.role || "").toLowerCase();
      if (role !== "author" || !Boolean(author?.isFollowing)) return false;

      if (!normalizedSearch) return true;

      const haystack = [author?.fullName, author?.username, author?.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [authorsQuery.data, normalizedSearch]);

  const followers = useMemo(
    () => {
      const list = Array.isArray(followersQuery.data) ? followersQuery.data : [];

      if (!normalizedSearch) return list;

      return list.filter((follower) => {
        const haystack = [follower?.fullName, follower?.username, follower?.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      });
    },
    [followersQuery.data, normalizedSearch]
  );

  return (
    <div className="min-h-screen pt-28 md:pt-32 pb-16 bg-background dark:bg-background">
      <Container>
        <div className="max-w-7xl mx-auto space-y-6">
          <section className="rounded-[1.6rem] border border-beige bg-light p-5 sm:p-6 shadow-lg dark:bg-background dark:border-light/20">
            <div className="mx-auto w-full max-w-2xl">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search followers or following..."
                className="w-full rounded-xl border border-beige bg-background px-4 py-3 text-sm text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-light/20 dark:bg-background dark:text-light"
              />
            </div>

            <div className="mt-5">
              <SubscriberConnections following={following} followers={followers} />
            </div>
          </section>
        </div>
      </Container>
    </div>
  );
}

export default React.memo(SubscriberConnectionsPage);