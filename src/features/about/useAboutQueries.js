import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aboutService } from "./aboutApi";

const aboutKeys = {
  resumeLinks: ["about", "resumeLinks"],
};

export const useResumeLinksQuery = () => {
  return useQuery({
    queryKey: aboutKeys.resumeLinks,
    queryFn: async () => {
      const [previewUrl, downloadUrl] = await Promise.all([
        aboutService.resolveResumePreviewFileUrl().catch(() => aboutService.getResumePreviewUrl()),
        aboutService.resolveResumeDownloadFileUrl().catch(() => aboutService.getResumeDownloadUrl()),
      ]);

      return {
        previewUrl,
        downloadUrl,
      };
    },
  });
};

export const useUploadResumeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, onProgress }) => aboutService.uploadResume(file, onProgress),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: aboutKeys.resumeLinks });
    },
  });
};

export const useDeleteResumeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => aboutService.deleteResume(),
    onSuccess: async () => {
      queryClient.setQueryData(aboutKeys.resumeLinks, {
        previewUrl: aboutService.getResumePreviewUrl(),
        downloadUrl: aboutService.getResumeDownloadUrl(),
      });
      await queryClient.invalidateQueries({ queryKey: aboutKeys.resumeLinks });
    },
  });
};
