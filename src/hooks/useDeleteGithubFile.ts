import { useState } from "react";
import type { GithubFile } from "../utils/useRepoFiles";
import useSelectedRepo from "../utils/useSelectedRepo";
import { useToast } from "../utils/use-toast";
import { useSession } from "next-auth/react";

const useDeleteGithubFile = () => {
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<GithubFile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const repo = useSelectedRepo();
  const { toast } = useToast();
  const {data: session} = useSession();

  const handleDeleteFromGitHub = async (file: GithubFile) => {
    if (typeof window === "undefined") {
      return;
    }

    setFileToDelete(file);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;

    setDeleteInProgress(true);

    const accessToken = session?.accessToken;
    const repoFullName = repo?.full_name;
    const commitMessage = `Deleted file with name ${fileToDelete.name}`;
    const committer = {
      name: "GaaCBot",
      email: "noreply@gaac.vercel.app",
    };

    try {
      const requestUrl = `https://api.github.com/repos/${repoFullName}/contents/${fileToDelete.path}`;
      const requestMethod = "DELETE";
      const requestHeaders = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      };
      const requestBody = {
        message: commitMessage,
        sha: fileToDelete.sha,
        committer,
      };

      const response = await fetch(requestUrl, {
        method: requestMethod,
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast({
        title: "Success",
        description: `File ${fileToDelete.name} deleted successfully`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as any).message,
        variant: "destructive",
      });
    } finally {
      setDeleteInProgress(false);
      setFileToDelete(null);
      setIsDialogOpen(false);
    }
  };

  return {
    handleDeleteFromGitHub,
    deleteInProgress,
    isDialogOpen,
    setIsDialogOpen,
    fileToDelete,
    confirmDelete,
  };
};

export default useDeleteGithubFile;
