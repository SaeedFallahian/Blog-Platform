'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CommentForm from './CommentForm';
import { Trash2 } from 'lucide-react';

type Comment = {
  id: string;
  postId: string;
  content: string;
  author: string;
  created_at: string;
  authorName: string;
  parentId?: string | null;
  replies?: Comment[];
};

type CommentListProps = {
  postId: string;
  user: any;
  onCommentAdded: () => void;
};

export default function CommentList({ postId, user, onCommentAdded }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError(null);
        const cleanPostId = postId.split(':')[1] || postId;
        const response = await fetch(`/api/comments/post/${cleanPostId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `خطا در گرفتن کامنت‌ها: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched comments:', data); // برای دیباگ
        setComments(data);
      } catch (err: any) {
        console.error('Error fetching comments:', err);
        setError('خطا در گرفتن کامنت‌ها: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId, onCommentAdded]);

  const handleReplyClick = (commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
  };

  const handleAuthorClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleDelete = async (commentId: string) => {
    if (!user) {
      alert('برای حذف کامنت باید وارد شوید');
      return;
    }

    if (!confirm('آیا مطمئن هستید که می‌خواهید این کامنت را حذف کنید؟')) {
      return;
    }

    try {
      const cleanCommentId = commentId.split(':')[1] || commentId;
      const response = await fetch(`/api/comments/${cleanCommentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در حذف کامنت');
      }

      onCommentAdded(); // Refresh comments
    } catch (err: any) {
      alert('خطا در حذف کامنت: ' + err.message);
    }
  };

  const handleReplySubmitted = () => {
    setReplyingTo(null); // بستن کادر ریپلای
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    return (
      <div key={comment.id} className={`comment ${depth > 0 ? 'reply' : ''}`} style={{ marginLeft: `${depth * 20}px` }}>
        <p>
          <span className="author-name" onClick={() => handleAuthorClick(comment.author)}>
            {comment.authorName}
          </span>: {comment.content}
        </p>
        <p className="comment-date">
          {new Date(comment.created_at).toLocaleDateString('en-US')}
        </p>
        <div className="comment-actions">
          {user && (
            <button className="comment-reply-btn" onClick={() => handleReplyClick(comment.id)}>
              Reply
            </button>
          )}
          {user && comment.author === user.id && (
            <button className="comment-delete-btn" onClick={() => handleDelete(comment.id)} title="حذف کامنت">
              <Trash2 size={16} />
            </button>
          )}
        </div>
        {replyingTo === comment.id && user && (
          <CommentForm
            postId={postId}
            user={user}
            parentId={comment.id}
            onCommentAdded={onCommentAdded}
            onReplySubmitted={handleReplySubmitted} // پراپ جدید
          />
        )}
        {comment.replies && comment.replies.length > 0 && (
          <div className="replies">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return <div className="container">Error: {error}</div>;
  }

  if (loading) {
    return <div className="container">Uploading...</div>;
  }

  if (comments.length === 0) {
    return <div className="container">There is no Comment</div>;
  }

  return <div className="comment-list">{comments.map((comment) => renderComment(comment))}</div>;
}