import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllPosts } from "../features/post/postThunks";
import { 
  selectAllPosts, 
  selectPostLoading 
} from "../features/post/postSlice";
import { Contaner, PostCard } from "../components";

function Home() {
  const dispatch = useDispatch();
  const hasFetched = useRef(false);
  const posts = useSelector(selectAllPosts);
  const loading = useSelector(selectPostLoading);
  const safePosts = Array.isArray(posts) ? posts : [];

  useEffect(() => {
    if (!hasFetched.current) {
      dispatch(getAllPosts());
      hasFetched.current = true;
    }
  }, [dispatch]);

  if (loading) {
    return (
      <div className="w-full py-8 text-center">
        <h1>Loading posts...</h1>
      </div>
    );
  }

  if (safePosts.length === 0) {
    return (
      <div className="w-full py-8 text-center">
        <p>No posts found.</p>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      <Contaner>
        <div className="flex flex-wrap -mx-2">
          {safePosts.slice(0, 4).map((post) => (
            <div
              key={post._id || post.slug}
              className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 p-2"
            >
              <PostCard post={post} />
            </div>
          ))}
        </div>
      </Contaner>
    </div>
  );
}

export default React.memo(Home);
