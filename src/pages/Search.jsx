import { useSelector } from 'react-redux';
import { selectAllPosts, selectPostLoading } from '../features/post/postSlice';
import PostCard from '../components/PostCard';

function Search() {
  const posts = useSelector(selectAllPosts);
  const loading = useSelector(selectPostLoading);

  return (
    <div className="py-12">
      <Contaner>
        <h1 className="text-3xl font-bold mb-8">Search Results</h1>
        {loading ? (
          <p>Loading...</p>
        ) : posts.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => <PostCard key={post._id} post={post} />)}
          </div>
        ) : (
          <p>No results found</p>
        )}
      </Contaner>
    </div>
  );
}

export default Search;