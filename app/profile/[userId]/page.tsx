'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import PostList from '@/components/PostList';
import SearchBox from '@/components/SearchBox';
import PostFilter from '@/app/components/PostFilter';

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

type Props = {
  params: { userId: string };
  searchParams: { q?: string };
};

export default function ProfilePage({ params, searchParams }: Props) {
  const { userId } = params;
  const searchQuery = searchParams.q || '';
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [likeStatuses, setLikeStatuses] = useState<{ [key: string]: LikeStatus }>({});
  const [error, setError] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string>('Unknown Email');
  const [profileImage, setProfileImage] = useState<string>('/default-avatar.png');
  const [userData, setUserData] = useState<any>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('newest');

  useEffect(() => {
    async function fetchUserAndPosts() {
      try {
        // گرفتن اطلاعات کاربر از API
        const userResponse = await fetch(`/api/users/${userId}`);
        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          console.error('API error response (user):', errorData);
          throw new Error(errorData.error || 'Error fetching user');
        }
        const fetchedUser = await userResponse.json();
        const name = fetchedUser.firstName || fetchedUser.fullName || fetchedUser.email || 'Unknown Email';
        const image = fetchedUser.imageUrl || '/default-avatar.png';
        setAuthorName(name);
        setProfileImage(image);
        setUserData(fetchedUser);

        // گرفتن پست‌ها
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const url = searchQuery
          ? `/api/posts/by-author/${userId}?q=${encodeURIComponent(searchQuery)}`
          : `/api/posts/by-author/${userId}`;
        console.log('Fetching posts from URL:', `${baseUrl}${url}`);
        const response = await fetch(`${baseUrl}${url}`);
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error response (posts):', errorData);
          throw new Error(errorData.error || 'Error fetching posts');
        }
        const fetchedPosts: Post[] = await response.json();
        console.log('Fetched posts:', fetchedPosts);
        setPosts(fetchedPosts);
        setFilteredPosts(fetchedPosts);

        const likeStatuses: { [key: string]: LikeStatus } = {};
        await Promise.all(
          fetchedPosts.map(async (post: Post) => {
            const likeRes = await fetch(`${baseUrl}/api/likes/${post.id.split(':')[1]}`);
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
        console.error(`Error: ${err.message}`);
        setError(err.message || 'Error to Get User Profile');
      }
    }
    fetchUserAndPosts();
  }, [userId, searchQuery]);

  // آپدیت filteredPosts وقتی likeStatuses یا currentFilter تغییر می‌کنه
  useEffect(() => {
    let sortedPosts = [...posts];
    console.log('Re-sorting posts with filter:', currentFilter);
    console.log('Posts before sorting:', sortedPosts);
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
    console.log('Posts after sorting:', sortedPosts);
    setFilteredPosts(sortedPosts);
  }, [likeStatuses, currentFilter, posts]);

  const handleFilterChange = (filter: FilterType) => {
    console.log('Filter selected:', filter);
    setCurrentFilter(filter);
  };

  // هندل کردن تغییر لایک از PostList
  const handleLikeChange = (postId: string, newLikeStatus: LikeStatus) => {
    console.log('Like changed for post:', postId, newLikeStatus);
    setLikeStatuses((prev) => ({
      ...prev,
      [postId]: newLikeStatus,
    }));
  };

  if (error) {
    return (
      <div className="container">
        <h1 className="profile-title">Error</h1>
        <p className="profile-error">Error to Get User Profile: {error}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="profile-title">Profile {authorName}</h1>
      <div className="profile-info">
        <img src={profileImage} alt={authorName} className="profile-image" />
        <div>
          <p>
            <strong>Name:</strong>
            {userData?.firstName || userData?.fullName || 'Getting Info...'}
          </p>
          <p>
            <strong>Email:</strong>
            {userData?.email || 'Getting Info...'}
          </p>
          <p>
            <strong>Last Activity:</strong>
            {userData?.updatedAt ? new Date(userData.updatedAt).toLocaleDateString('en-US') : 'Getting Info...'}
          </p>
          <p>
            <strong>Account Created at:</strong>
            {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US') : 'Getting Info...'}
          </p>
        </div>
      </div>
      <SearchBox className='newsearch'
        defaultValue={searchQuery}
        placeholder="Searching For This User`s Posts"
        formAction={`/profile/${userId}`}
      />
      <PostFilter onFilterChange={handleFilterChange} />
      <PostList
        posts={filteredPosts}
        searchQuery={searchQuery}
        authorId={userId}
        onLikeChange={handleLikeChange} // پراپ جدید
      />
    </div>
  );
}