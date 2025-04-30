'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'title') setTitle(value);
    if (name === 'content') setContent(value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    }
  };

  return (
    <div className="container">
      <h2 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '16px' }}>
        Create a New Post
      </h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="title"
            style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px' }}
          >
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label
            htmlFor="content"
            style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px' }}
          >
            Content
          </label>
          <textarea
            id="content"
            name="content"
            value={content}
            onChange={handleChange}
            rows={5}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Create Post</button>
      </form>
    </div>
  );
}