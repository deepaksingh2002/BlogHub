import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "./subscriptionApi";

const subscriptionKeys = {
  authors: ["authors", "list"],
};

const normalizeAuthors = (payload) => {
  const list =
    payload?.data ||
    payload?.authors ||
    payload ||
    [];

  if (!Array.isArray(list)) return [];

  return list.map((author) => ({
    ...author,
    followerCount: Number(author?.followerCount || 0),
    isFollowing: Boolean(author?.isFollowing),
  }));
};

export const useAuthorsListQuery = (enabled = true) => {
  return useQuery({
    queryKey: subscriptionKeys.authors,
    enabled,
    queryFn: async () => {
      const response = await subscriptionService.getAuthors();
      return normalizeAuthors(response);
    },
  });
};

export const useToggleFollowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (authorId) => {
      const response = await subscriptionService.toggleFollow(authorId);
      return { authorId, response };
    },
    onMutate: async (authorId) => {
      await queryClient.cancelQueries({ queryKey: subscriptionKeys.authors });

      const previousAuthors = queryClient.getQueryData(subscriptionKeys.authors);

      queryClient.setQueryData(subscriptionKeys.authors, (existing) => {
        if (!Array.isArray(existing)) return existing;

        return existing.map((author) => {
          if (String(author?._id) !== String(authorId)) return author;

          const nextFollowing = !Boolean(author?.isFollowing);
          return {
            ...author,
            isFollowing: nextFollowing,
            followerCount: Math.max(
              0,
              Number(author?.followerCount || 0) + (nextFollowing ? 1 : -1)
            ),
          };
        });
      });

      return { previousAuthors };
    },
    onError: (_error, _authorId, context) => {
      if (context?.previousAuthors) {
        queryClient.setQueryData(subscriptionKeys.authors, context.previousAuthors);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: subscriptionKeys.authors });
    },
  });
};
