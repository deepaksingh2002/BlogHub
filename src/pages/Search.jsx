import { useSearchParams } from 'react-router-dom';
import { Container } from '../components';
import { useSearchPostsQuery } from '../features/post/usePostQueries';
import PostCard from '../components/PostCard';

function Search() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const {
    data: posts = [],
    isLoading: loading,
    error,
  } = useSearchPostsQuery(query);

  return (
    <div className="py-32 min-h-screen bg-background dark:bg-background">
      <Container>
        <h1 className="text-3xl font-bold mb-8 text-center text-dark dark:text-dark">
          Search Results {query ? `for "${query}"` : ""}
        </h1>
        {!query ? (
          <p className="text-dark/70 dark:text-dark/70">Enter a search term to find posts.</p>
        ) : loading ? (
          <p className="text-dark/70 dark:text-dark/70">Loading...</p>
        ) : error ? (
          <p className="text-warning">{error?.message || "Search failed"}</p>
        ) : posts.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => <PostCard key={post._id} post={post} />)}
          </div>
        ) : (
          <p className="text-dark/70 dark:text-dark/70">No results found</p>
        )}
      </Container>
    </div>
  );
}

export default Search;
