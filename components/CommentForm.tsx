'use client';

import { useState } from 'react';

type CommentFormProps = {
  postId: string;
  user: any;
  parentId?: string | null;
  onCommentAdded?: () => void;
  onReplySubmitted?: () => void; // پراپ جدید
};

export default function CommentForm({ postId, user, parentId, onCommentAdded, onReplySubmitted }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('برای ارسال کامنت باید وارد شوید');
      return;
    }
    if (!content.trim()) {
      setError('محتوای کامنت نمی‌تواند خالی باشد');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content,
          parentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در ارسال کامنت');
      }

      setContent('');
      if (onCommentAdded) onCommentAdded();
      if (parentId && onReplySubmitted) onReplySubmitted(); // اطلاع به والد برای بستن کادر ریپلای
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? 'Write Reply' : 'Write Your Comment'}
        disabled={isSubmitting}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : parentId ? 'Send Reply ' : 'Send Comment'}
      </button>
    </form>
  );
}