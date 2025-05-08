'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import CommentSection from '@/components/CommentSection';

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  imageUrl?: string;
  authorName?: string;
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

export default function PostDetail({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [likeStatus, setLikeStatus] = useState<LikeStatus>({ likesCount: 0, userLiked: false });
  const [favoriteStatus, setFavoriteStatus] = useState<FavoriteStatus>({ favoritesCount: 0, userFavorited: false });
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    async function fetchPost() {
      try {
        const cleanPostId = params.id.split(':')[1] || params.id;
        console.log('Fetching post with ID:', cleanPostId);
        const response = await fetch(`/api/posts/${cleanPostId}`);
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error response:', errorData);
          throw new Error(errorData.error || 'Failed to fetch post');
        }
        const data = await response.json();
        console.log('Fetched post data:', data);
        setPost(data);
        setError(null);

        const likeRes = await fetch(`/api/likes/${cleanPostId}`);
        if (likeRes.ok) {
          setLikeStatus(await likeRes.json());
        } else {
          console.error('Failed to fetch like status:', await likeRes.json());
        }
        const favoriteRes = await fetch(`/api/favorites/${cleanPostId}`);
        if (favoriteRes.ok) {
          setFavoriteStatus(await favoriteRes.json());
        } else {
          console.error('Failed to fetch favorite status:', await favoriteRes.json());
        }
      } catch (err: any) {
        console.error(`Error fetching post: ${err.message}`);
        setError(err.message);
      }
    }
    fetchPost();
  }, [params.id]);

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
        throw new Error(errorData.error || 'Error deleting post');
      }

      const result = await response.json();
      console.log('DELETE RESPONSE =>', result);
      router.push('/posts');
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
      const response = await fetch(`/api/likes/${postId.split(':')[1]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error liking post');
      }

      const { liked } = await response.json();
      setLikeStatus((prev) => ({
        likesCount: liked ? prev.likesCount + 1 : prev.likesCount - 1,
        userLiked: liked,
      }));
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
      const response = await fetch(`/api/favorites/${postId.split(':')[1]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error adding to favorites');
      }

      const { favorited } = await response.json();
      setFavoriteStatus((prev) => ({
        favoritesCount: favorited ? prev.favoritesCount + 1 : prev.favoritesCount - 1,
        userFavorited: favorited,
      }));
      setError(null);
    } catch (err: any) {
      console.error(`Favorite error: ${err.message}`);
      setError(err.message || 'Error adding to favorites');
    }
  };

  if (error) return <div className="container">Error: {error}</div>;
  if (!post) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div className="post">
        <Link href={`/posts/${post.id.split(':')[1]}`}>
          {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="post-image" />}
          {post.title}
        </Link>
        <h4></h4>
        <p className="post-content">{post.content}</p>
        <p className="meta">
        Author:{' '}
          <Link href={`/profile/${post.author}`} className="author-link">
            {post.authorName || post.author || 'ناشناس'}
          </Link>
        </p>
        <p className="meta">
         Post Date {new Date(post.created_at).toLocaleDateString('en-US')}
        </p>
        {post.updated_at && (
          <p className="meta">
           Update: {new Date(post.updated_at).toLocaleDateString('en-US')}
          </p>
        )}
        <div className="like-favorite-section">
          <div className="like-section">
            <button
              onClick={() => handleLike(post.id)}
              className={`like-button ${likeStatus.userLiked ? 'liked' : ''}`}
              disabled={!user}
              data-tooltip="لایک"
            >
              <Heart
                size={20}
                fill={likeStatus.userLiked ? '#dc2626' : 'none'}
                color={likeStatus.userLiked ? '#dc2626' : '#4b5563'}
              />
            </button>
            <span className="like-count">{likeStatus.likesCount || 0}</span>
          </div>
          <div className="favorite-section">
            <button
              onClick={() => handleFavorite(post.id)}
              className={`favorite-button ${favoriteStatus.userFavorited ? 'favorited' : ''}`}
              disabled={!user}
              data-tooltip="علاقه‌مندی"
            >
              <Star
                size={20}
                fill={favoriteStatus.userFavorited ? '#eab308' : 'none'}
                color={favoriteStatus.userFavorited ? '#eab308' : '#4b5563'}
              />
            </button>
            <span className="favorite-count">{favoriteStatus.favoritesCount || 0}</span>
          </div>
        </div>
        {user && (
          <div className="actions">
            {post.author === user.id && (
              <button
                className="edit"
                onClick={() => router.push(`/edit-post/${post.id.split(':')[1]}`)}
              >
                ویرایش
              </button>
            )}
            {(post.author === user.id || (user?.publicMetadata?.role === 'admin')) && (
              <button className="delete" onClick={() => handleDelete(post.id)}>
                حذف
              </button>
            )}
          </div>
        )}
      </div>
      <CommentSection postId={params.id} user={user} />
    </div>
  );
}