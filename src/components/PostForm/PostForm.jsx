import React from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { createPost, updatePost, deletePost } from "../../features/post/postThunks";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectPostLoading } from "../../features/post/postSlice";
import RTE from "../RTE";
import LoadingAnimation from "../Animation/LoadingAnimation";

export default function PostForm({ post }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectPostLoading);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      title: post?.title || "",
      category: post?.category || "", // Fixed typo
      content: post?.content || "",
    },
  });

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("content", data.content);
      formData.append("category", data.category); // Fixed typo

      if (data.thumbnail?.[0]) {
        formData.append("thumbnail", data.thumbnail[0]);
      }

      if (post?._id) {
        await dispatch(updatePost({ postId: post._id, formData })).unwrap();
      } else {
        await dispatch(createPost(formData)).unwrap();
        reset(); // Clear form after create
      }

      navigate("/all-post");
    } catch (err) {
      console.error("Submit error:", err);
      alert(err?.message || "Something went wrong!");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await dispatch(deletePost(post._id)).unwrap();
      navigate("/all-post");
    } catch (err) {
      alert(err?.message || "Delete failed!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent animate-slide-up">
            {post ? "Edit Post" : "Create Post"}
          </h1>
          <p className="text-xl text-black/70 max-w-2xl mx-auto leading-relaxed">
            {post ? "Update your story" : "Share your story with the world"}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">Post Title</label>
            <input
              className={`w-full px-5 py-4 rounded-2xl border-2 bg-white/50 backdrop-blur-sm shadow-lg focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all duration-300 text-lg font-semibold ${
                errors.title 
                  ? 'border-red-300 bg-red-50/50' 
                  : 'border-primary/20 hover:border-primary/40 focus:border-primary'
              }`}
              placeholder="Enter a compelling title for your post..."
              {...register("title", { 
                required: "Title is required",
                minLength: { value: 5, message: "Minimum 5 characters" }
              })}
            />
            {errors.title && (
              <p className="mt-2 text-sm text-red-500 font-medium">{errors.title.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">Category</label>
            <select
              className={`w-full px-5 py-4 rounded-2xl border-2 bg-white/50 backdrop-blur-sm shadow-lg focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all duration-300 text-lg font-semibold appearance-none bg-no-repeat bg-right pr-10 ${
                errors.category
                  ? 'border-red-300 bg-red-50/50'
                  : 'border-primary/20 hover:border-primary/40 focus:border-primary'
              }`}
              {...register("category", { required: "Please select a category" })}
            >
              <option value="">Select a category</option>
              <option value="Tech">Tech</option>
              <option value="Technology">Technology</option>
              <option value="Health">Health</option>
              <option value="Science">Science</option>
              <option value="Sports">Sports</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Lifestyle">Lifestyle</option>
              <option value="Business">Business</option>
            </select>
            {errors.category && (
              <p className="mt-2 text-sm text-red-500 font-medium">{errors.category.message}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">Content</label>
            <RTE 
              name="content" 
              label="Write your story..." 
              control={control}
              rules={{ required: "Content is required" }}
            />
            {errors.content && (
              <p className="mt-2 text-sm text-red-500 font-medium">{errors.content.message}</p>
            )}
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">Thumbnail Image (Optional)</label>
            <div className="relative border-2 border-dashed border-primary/20 bg-white/50 backdrop-blur-sm rounded-2xl p-8 text-center hover:border-primary/40 transition-all duration-300 group">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                {...register("thumbnail")}
              />
              <div className="space-y-2 pointer-events-none">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto border-2 border-primary/30 group-hover:bg-primary/30 transition-all duration-300">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-black group-hover:text-primary transition-colors">Click to upload image</p>
                <p className="text-sm text-black/60">PNG, JPG up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`group relative flex-1 bg-primary text-white font-black py-5 px-8 rounded-2xl shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-500 text-lg border-2 border-primary/20 hover:border-primary flex items-center justify-center gap-3 ${
                loading 
                  ? 'opacity-70 cursor-not-allowed' 
                  : 'hover:scale-[1.02]'
              }`}
            >
              {loading ? (
                <>
                  <LoadingAnimation type="spinner" size="sm" color="primary" />
                  <span>{post ? "Updating..." : "Creating..."}</span>
                </>
              ) : (
                <>
                  {post ? "Update Post" : "Create Post"}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>

            {post && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-8 py-5 bg-gradient-to-r from-red-500 to-red-600 text-white font-black rounded-2xl shadow-xl hover:shadow-red-400 hover:-translate-y-1 transition-all duration-500 border border-red-500/20 hover:border-red-500 text-lg flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Post
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
