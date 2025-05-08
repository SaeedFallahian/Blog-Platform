// فایل: app/edit-post/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  imageUrl?: string;
};

export default function EditPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { id } = useParams();
  const { user } = useUser();

  useEffect(() => {
    async function fetchPost() {
      try {
        if (!user || !id) return;

        const response = await fetch(`/api/posts/${id}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch post');
        }

        const post: Post = await response.json();
        setTitle(post.title);
        setContent(post.content);
        setImageUrl(post.imageUrl || null);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch post');
      }
    }

    fetchPost();
  }, [user, id]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setUploading(true);

      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setImageUrl(data.url);
          setError(null);
        } else {
          setError('خطا در آپلود تصویر');
        }
      } catch (error) {
        setError('خطا در آپلود تصویر');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`/api/posts/${id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          imageUrl: imageUrl || undefined,
        }),
      });

      if (res.ok) {
        router.push('/');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'خطا در به‌روزرسانی پست');
      }
    } catch (error) {
      setError('خطا در به‌روزرسانی پست');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px' }}>
        ویرایش پست
      </h3>
      {error && (
        <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</p>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="title"
            style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}
          >
            عنوان
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
            }}
            required
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="content"
            style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}
          >
            محتوا
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              minHeight: '120px',
            }}
            required
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="image"
            style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}
          >
            تصویر
          </label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            disabled={uploading}
            style={{ display: 'block' }}
          />
          {uploading && (
            <p style={{ color: '#4b5563', marginTop: '8px' }}>Uploading...</p>
          )}
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              style={{ marginTop: '8px', maxWidth: '100%', height: 'auto' }}
            />
          )}
        </div>
        <button
          type="submit"
          disabled={uploading} // فقط وقتی در حال آپلود است غیرفعال می‌شود
          style={{
            backgroundColor: uploading ? '#d1d5db' : '#2563eb',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          Update
        </button>
      </form>
    </div>
  );
}