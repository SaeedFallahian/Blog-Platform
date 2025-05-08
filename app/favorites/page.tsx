'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import PostList from '@/components/PostList';
import SearchBox from '@/components/SearchBox';
import PostFilter from '../components/PostFilter';

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  imageUrl?: string;
  authorName: string;
  updated_at?: string;
  favorited_at?: string;
};

type LikeStatus = {
  likesCount: number;
  userLiked: boolean;
};

type FilterType = 'oldest' | 'newest' | 'mostLiked';

export default function FavoritesPage({ searchParams }: { searchParams: { q?: string } }) {
  const searchQuery = searchParams.q || '';
  const { user, isSignedIn } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [likeStatuses, setLikeStatuses] = useState<{ [key: string]: LikeStatus }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setError('Please sign in to view your favorites');
      return;
    }

    async function fetchPosts() {
      try {
        const url = searchQuery
          ? `/api/favorites/user?q=${encodeURIComponent(searchQuery)}`
          : '/api/favorites/user';
        console.log('Fetching posts from URL:', url);
        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error response:', errorData);
          throw new Error(errorData.error || 'Error fetching posts');
        }
        const fetchedPosts: Post[] = await response.json();
        console.log('Fetched posts:', fetchedPosts);
        setPosts(fetchedPosts);
        setFilteredPosts(fetchedPosts);

        const likeStatuses: { [key: string]: LikeStatus } = {};
        await Promise.all(
          fetchedPosts.map(async (post: Post) => {
            const likeRes = await fetch(`/api/likes/${post.id.split(':')[1]}`);
            if (likeRes.ok) {
              likeStatuses[post.id] = await likeRes.json();
            } else {
              console.error(`Failed to fetch like status for post ${post.id}:`, await likeRes.json());
            }
          })
        );
        console.log('Like statuses:', likeStatuses);
        setLikeStatuses(likeStatuses);
        setError(null);
      } catch (err: any) {
        console.error(`Fetch posts error: ${err.message}`);
        setError(err.message || 'Error fetching posts');
      }
    }
    fetchPosts();
  }, [searchQuery, isSignedIn]);

  const handleFilterChange = (filter: FilterType) => {
    console.log('Filter selected:', filter);
    let sortedPosts = [...posts];
    console.log('Posts before sorting:', sortedPosts);
    switch (filter) {
      case 'oldest':
        sortedPosts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'newest':
        sortedPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'mostLiked':
        sortedPosts.sort((a, b) => (likeStatuses[b.id]?.likesCount || 0) - (likeStatuses[a.id]?.likesCount || 0));
        break;
    }
    console.log('Posts after sorting:', sortedPosts);
    setFilteredPosts(sortedPosts);
  };

  return (
    <div className="container">
      <h2 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '16px' }}>
        Your Favorite Posts
      </h2>
      <p style={{ marginBottom: '16px', color: '#4b5563' }}>
        View all posts you’ve added to your favorites.
      </p>
      <SearchBox defaultValue={searchQuery} formAction="/favorites" />
      {error ? (
        <p className="error" style={{ marginBottom: '16px' }}>
          {error}
        </p>
      ) : (
        <>
          <PostFilter onFilterChange={handleFilterChange} />
          <PostList
            posts={filteredPosts}
            searchQuery={searchQuery}
            isFavorites={true}
          />
        </>
      )}
    </div>
  );
}