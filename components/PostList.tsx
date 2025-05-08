'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';

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

type FavoriteStatus = {
  favoritesCount: number;
  userFavorited: boolean;
};

type Props = {
  posts?: Post[];
  searchQuery: string;
  isAllPosts?: boolean;
  isFavorites?: boolean;
  authorId?: string;
  isAdmin?: boolean;
  deleteAdmin?: boolean;
  onLikeChange?: (postId: string, newLikeStatus: LikeStatus) => void; // پراپ جدید
};

export default function PostList({
  posts: externalPosts,
  searchQuery,
  isAllPosts = false,
  isFavorites = false,
  authorId,
  isAdmin = false,
  deleteAdmin = false,
  onLikeChange,
}: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [likeStatuses, setLikeStatuses] = useState<{ [key: string]: LikeStatus }>({});
  const [favoriteStatuses, setFavoriteStatuses] = useState<{ [key: string]: FavoriteStatus }>({});
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    async function fetchPosts() {
      try {
        if (externalPosts) {
          console.log('Using external posts:', externalPosts);
          setPosts(externalPosts);
        } else {
          let url: string;
          if (isFavorites) {
            if (!user) {
              setError('Please sign in to view your favorite posts');
              return;
            }
            url = searchQuery
              ? `/api/favorites/user?q=${encodeURIComponent(searchQuery)}`
              : '/api/favorites/user';
          } else if (searchQuery) {
            url = `/api/posts/search?q=${encodeURIComponent(searchQuery)}`;
          } else if (authorId) {
            url = `/api/posts/by-author/${authorId}`;
          } else if (isAllPosts) {
            url = '/api/posts';
          } else {
            if (!user) {
              setError('Please sign in to view your posts');
              return;
            }
            url = '/api/user-posts';
          }

          console.log(`Fetching posts from: ${url}`);
          const response = await fetch(url);
          if (!response.ok) {
            const errorData = await response.json();
            console.error('API error response:', errorData);
            throw new Error(errorData.error || 'Error fetching posts');
          }

          const fetchedPosts: Post[] = await response.json();
          console.log('Fetched posts in PostList:', fetchedPosts);
          setPosts(fetchedPosts);
        }

        const currentPosts = externalPosts || posts;
        const likeStatuses: { [key: string]: LikeStatus } = {};
        await Promise.all(
          currentPosts.map(async (post: Post) => {
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

        const favoriteStatuses: { [key: string]: FavoriteStatus } = {};
        await Promise.all(
          currentPosts.map(async (post: Post) => {
            const favoriteRes = await fetch(`/api/favorites/${post.id.split(':')[1]}`);
            if (favoriteRes.ok) {
              favoriteStatuses[post.id] = await favoriteRes.json();
            } else {
              console.error(`Failed to fetch favorite status for post ${post.id}:`, await favoriteRes.json());
            }
          })
        );
        console.log('Favorite statuses:', favoriteStatuses);
        setFavoriteStatuses(favoriteStatuses);
        setError(null);
      } catch (err: any) {
        console.error(`Fetch posts error: ${err.message}`);
        setError(err.message || 'Error fetching posts');
      }
    }

    fetchPosts();
  }, [user, searchQuery, isAllPosts, isFavorites, authorId, externalPosts]);

  const handleDelete = async (id: string) => {
    try {
      if (!user) {
        setError('Please sign in to delete a post');
        return;
      }

      const postId = id.split(':')[1];
      console.log(`Sending DELETE request for post: ${postId}`);
      const response = await fetch(`/api/posts/${postId}/delete`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete error response:', errorData);
        throw new Error(errorData.error || 'Error deleting post');
      }

      const result = await response.json();
      console.log('DELETE RESPONSE =>', result);
      setPosts(posts.filter((post) => post.id !== id));
      setError(null);
    } catch (err: any) {
      console.error(`Delete error: ${err.message}`);
      setError(err.message || 'Error deleting post');
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      setError('Please sign in to like a post');
      return;
    }

    try {
      console.log(`Sending LIKE request for post: ${postId}`);
      const response = await fetch(`/api/likes/${postId.split(':')[1]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Like error response:', errorData);
        throw new Error(errorData.error || 'Error liking post');
      }

      const { liked } = await response.json();
      console.log(`Like response: liked=${liked}`);
      const newLikeStatus = {
        likesCount: liked ? likeStatuses[postId].likesCount + 1 : likeStatuses[postId].likesCount - 1,
        userLiked: liked,
      };
      setLikeStatuses((prev) => ({
        ...prev,
        [postId]: newLikeStatus,
      }));
      if (onLikeChange) {
        onLikeChange(postId, newLikeStatus); // اطلاع به والد
      }
      setError(null);
    } catch (err: any) {
      console.error(`Like error: ${err.message}`);
      setError(err.message || 'Error liking post');
    }
  };

  const handleFavorite = async (postId: string) => {
    if (!user) {
      setError('Please sign in to add to favorites');
      return;
    }

    try {
      console.log(`Sending FAVORITE request for post: ${postId}`);
      const response = await fetch(`/api/favorites/${postId.split(':')[1]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Favorite error response:', errorData);
        throw new Error(errorData.error || 'Error adding to favorites');
      }

      const { favorited } = await response.json();
      console.log(`Favorite response: favorited=${favorited}`);
      setFavoriteStatuses((prev) => ({
        ...prev,
        [postId]: {
          favoritesCount: favorited
            ? prev[postId].favoritesCount + 1
            : prev[postId].favoritesCount - 1,
          userFavorited: favorited,
        },
      }));
      setError(null);
    } catch (err: any) {
      console.error(`Favorite error: ${err.message}`);
      setError(err.message || 'Error adding to favorites');
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '16px' }}>
        {isFavorites
          ? 'Your Favorite Posts'
          : isAllPosts
          ? 'All Posts'
          : authorId
          ? 'Author Posts'
          : 'Your Posts'}
      </h3>
      {error && (
        <p className="error" style={{ marginBottom: '16px' }}>
          {error}
        </p>
      )}
      {posts.length === 0 && !error ? (
        <p style={{ color: '#4b5563' }}>
          No Post Found{' '}
          {isAllPosts || authorId || isFavorites
            ? ''
            : 'Create a New Post or Search For Another Post!!'}
        </p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="post">
            <Link href={`/posts/${post.id.split(':')[1]}`}>
              {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="post-image" />}
              {post.title}
            </Link>
            <h4></h4>
            <p className="post-content">{post.content}</p>
            <p className="meta">
              Author:{' '}
              <Link href={`/profile/${post.author}`} className="author-link">
                {post.authorName}
              </Link>
            </p>
            <p className="meta">
              Post Date: {new Date(post.created_at).toLocaleDateString('en-US')}
            </p>
            {post.updated_at && (
              <p className="meta">
                Updated at: {new Date(post.updated_at).toLocaleDateString('en-US')}
              </p>
            )}
            <div className="like-favorite-section">
              <div className="like-section">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`like-button ${likeStatuses[post.id]?.userLiked ? 'liked' : ''}`}
                  disabled={!user}
                  data-tooltip="Like"
                >
                  <Heart
                    size={20}
                    fill={likeStatuses[post.id]?.userLiked ? '#dc2626' : 'none'}
                    color={likeStatuses[post.id]?.userLiked ? '#dc2626' : '#4b5563'}
                  />
                </button>
                <span className="like-count">{likeStatuses[post.id]?.likesCount || 0}</span>
              </div>
              <div className="favorite-section">
                <button
                  onClick={() => handleFavorite(post.id)}
                  className={`favorite-button ${
                    favoriteStatuses[post.id]?.userFavorited ? 'favorited' : ''
                  }`}
                  disabled={!user}
                  data-tooltip="Favorite"
                >
                  <Star
                    size={20}
                    fill={favoriteStatuses[post.id]?.userFavorited ? '#eab308' : 'none'}
                    color={favoriteStatuses[post.id]?.userFavorited ? '#eab308' : '#4b5563'}
                  />
                </button>
                <span className="favorite-count">
                  {favoriteStatuses[post.id]?.favoritesCount || 0}
                </span>
              </div>
            </div>
            {user && (
              <div className="actions">
                {post.author === user.id && (
                  <button
                    className="edit"
                    onClick={() => router.push(`/edit-post/${post.id.split(':')[1]}`)}
                  >
                    Edit
                  </button>
                )}
                {(post.author === user.id ||
                  (deleteAdmin && user.publicMetadata?.role === 'admin')) && (
                  <button className="delete" onClick={() => handleDelete(post.id)}>
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}