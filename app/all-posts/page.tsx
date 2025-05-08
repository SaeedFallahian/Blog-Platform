'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import PostList from '@/components/PostList';
import RecentPosts from '../components/RecentPosts';
import TopPosts from '../components/TopPosts';
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

export default function AllPosts() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [likeStatuses, setLikeStatuses] = useState<{ [key: string]: LikeStatus }>({});
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('newest'); // اضافه شده
  const { user } = useUser();

  useEffect(() => {
    async function fetchPosts() {
      try {
        const url = searchQuery ? `/api/posts/search?q=${encodeURIComponent(searchQuery)}` : '/api/posts';
        console.log('Fetching posts from URL:', url); // دیباگ
        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error response:', errorData); // دیباگ
          throw new Error(errorData.error || 'Error fetching posts');
        }
        const fetchedPosts: Post[] = await response.json();
        console.log('Fetched posts:', fetchedPosts); // دیباگ
        setPosts(fetchedPosts);
        setFilteredPosts(fetchedPosts);

        const likeStatuses: { [key: string]: LikeStatus } = {};
        await Promise.all(
          fetchedPosts.map(async (post: Post) => {
            const likeRes = await fetch(`/api/likes/${post.id.split(':')[1]}`);
            if (likeRes.ok) {
              likeStatuses[post.id] = await likeRes.json();
            } else {
              console.error(`Failed to fetch like status for post ${post.id}:`, await likeRes.json()); // دیباگ
            }
          })
        );
        console.log('Like statuses:', likeStatuses); // دیباگ
        setLikeStatuses(likeStatuses);
        setError(null);
      } catch (err: any) {
        console.error(`Fetch posts error: ${err.message}`); // دیباگ
        setError(err.message || 'Error fetching posts');
      }
    }
    fetchPosts();
  }, [searchQuery]);

  // آپدیت filteredPosts وقتی likeStatuses یا currentFilter تغییر می‌کنه
  useEffect(() => {
    let sortedPosts = [...posts];
    console.log('Re-sorting posts with filter:', currentFilter); // دیباگ
    console.log('Posts before sorting:', sortedPosts); // دیباگ
    switch (currentFilter) {
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
    console.log('Posts after sorting:', sortedPosts); // دیباگ
    setFilteredPosts(sortedPosts);
  }, [likeStatuses, currentFilter, posts]);

  const handleFilterChange = (filter: FilterType) => {
    console.log('Filter selected:', filter); // دیباگ
    setCurrentFilter(filter);
  };

  // هندل کردن تغییر لایک از PostList
  const handleLikeChange = (postId: string, newLikeStatus: LikeStatus) => {
    console.log('Like changed for post:', postId, newLikeStatus); // دیباگ
    setLikeStatuses((prev) => ({
      ...prev,
      [postId]: newLikeStatus,
    }));
  };

  return (
    <div className="container">
      <TopPosts />
      <RecentPosts />
      <h2 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '16px' }}></h2>
      <p style={{ marginBottom: '16px', color: '#4b5563' }}>
        All Post`s are here
      </p>
      <SearchBox defaultValue={searchQuery} formAction="/all-posts" />
      <PostFilter onFilterChange={handleFilterChange} />
      <PostList
        posts={filteredPosts}
        searchQuery={searchQuery}
        isAllPosts={true}
        isFavorites={false}
        authorId={undefined}
        isAdmin={user?.publicMetadata?.role === 'admin'}
        deleteAdmin={true}
        onLikeChange={handleLikeChange} // اضافه شده
      />
    </div>
  );
}