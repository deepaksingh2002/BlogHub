import React, { useEffect } from "react";
import { Container, PostForm } from "../components";
import { useNavigate, useParams } from "react-router-dom";
import { usePostQuery } from "../features/post/usePostQueries";

function EditPost() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const {
    data: post,
    isLoading: loading,
    error,
  } = usePostQuery(postId);

  useEffect(() => {
    if (!postId) {
      navigate("/all-post");
      return;
    }

  }, [postId, navigate]);

  if (loading && !post) return <div className="text-center py-8 text-dark dark:text-dark">Loading...</div>;
  if (!loading && !post) {
    return (
      <div className="text-center py-8 text-warning">
        {error?.message || "Post not found"}
      </div>
    );
  }

  return (
    <div className="pt-32 pb-16 min-h-screen bg-background dark:bg-background">
      <Container>
        <PostForm post={post} />
      </Container>
    </div>
  );
}

export default EditPost;
