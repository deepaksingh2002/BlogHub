import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { Contaner } from '../components';
import { searchPosts } from '../features/post/postThunks';
import { selectAllPosts, selectPostError, selectPostLoading } from '../features/post/postSlice';
import PostCard from '../components/PostCard';

function Search() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const posts = useSelector(selectAllPosts);
  const loading = useSelector(selectPostLoading);
  const error = useSelector(selectPostError);

  useEffect(() => {
    if (!query) return;
    dispatch(searchPosts(query));
  }, [dispatch, query]);

  return (
    <div className="py-32 min-h-screen bg-gray-50 dark:bg-slate-900">
      <Contaner>
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-slate-100">
          Search Results {query ? `for "${query}"` : ""}
        </h1>
        {!query ? (
          <p className="text-gray-600 dark:text-slate-300">Enter a search term to find posts.</p>
        ) : loading ? (
          <p className="text-gray-600 dark:text-slate-300">Loading...</p>
        ) : error ? (
          <p className="text-red-600 dark:text-red-300">{error}</p>
        ) : posts.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => <PostCard key={post._id} post={post} />)}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-slate-300">No results found</p>
        )}
      </Contaner>
    </div>
  );
}

export default Search;
