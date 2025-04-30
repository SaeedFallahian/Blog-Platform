'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  authorName: string;
};

type Props = {
  searchQuery: string;
  allPosts?: boolean;
};

export default function PostList({ searchQuery, allPosts = false }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    async function fetchPosts() {
      try {
        if (!user) return;

        let url = '/api/posts';
        if (allPosts) {
          url = '/api/posts?all=true';
        } else if (searchQuery) {
          url = `/api/posts/search?q=${encodeURIComponent(searchQuery)}`;
        }

        console.log(`Fetching posts from: ${url}`);

        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch posts');
        }

        const fetchedPosts: Post[] = await response.json();
        setPosts(fetchedPosts);
        setError(null);
      } catch (err: any) {
        console.error(`Fetch posts error: ${err.message}`);
        setError(err.message || 'Failed to fetch posts');
      }
    }

    fetchPosts();
  }, [user, searchQuery, allPosts]);

  const handleDelete = async (id: string) => {
    try {
      const postId = id.split(':')[1];
      console.log(`Sending DELETE request for post: ${postId}`);

      const response = await fetch(`/api/posts/${postId}/delete`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete post');
      }

      const result = await response.json();
      console.log('DELETE RESPONSE =>', result);

      // حذف پست از UI بدون چک کردن پیام خاص
      setPosts(posts.filter((post) => post.id !== id));
      setError(null);
    } catch (err: any) {
      console.error(`Delete error: ${err.message}`);
      setError(err.message || 'Failed to delete post');
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '16px' }}>
        {allPosts ? 'All Posts' : 'Your Posts'}
      </h3>
      {error && (
        <p className="error" style={{ marginBottom: '16px' }}>
          {error}
        </p>
      )}
      {posts.length === 0 ? (
        <p style={{ color: '#4b5563' }}>
          No posts found. {allPosts ? '' : 'Create a new post or try a different search term!'}
        </p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="post">
            <h4>{post.title}</h4>
            <p>{post.content}</p>
            <p className="meta">Author: {post.authorName}</p>
            <p className="meta">
              Date: {new Date(post.created_at).toLocaleDateString('en-US')}
            </p>
            {user && post.author === user.id && (
              <div className="actions">
                <button
                  className="edit"
                  onClick={() => router.push(`/edit-post/${post.id.split(':')[1]}`)}
                >
                  Edit
                </button>
                <button className="delete" onClick={() => handleDelete(post.id)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}