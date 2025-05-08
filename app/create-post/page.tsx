"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setUploading(true);

      const formData = new FormData();
      formData.append("image", file);

      try {
        const res = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setImageUrl(data.url);
          setError(null);
        } else {
          setError("خطا در آپلود تصویر");
        }
      } catch (error) {
        setError("خطا در آپلود تصویر");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, imageUrl }),
      });

      if (res.ok) {
        router.push("/");
      } else {
        const errorData = await res.json();
        setError(errorData.error || "خطا در ایجاد پست");
      }
    } catch (error) {
      setError("خطا در ایجاد پست");
    }
  };

  return (
    <div className="create-post">
      <h3> Create New Post </h3>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="نظر">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="image">Picture</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            disabled={uploading}
          />
          {uploading && <p className="uploading-text"> Uploading...</p>}
          {imageUrl && (
            <img src={imageUrl} alt="Prev" className="image-preview" />
          )}
        </div>
        <button type="submit" className="submit-button" disabled={uploading}>
         Create Post
        </button>
      </form>
    </div>
  );
}