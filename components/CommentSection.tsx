'use client';

import { useState, useEffect } from 'react';
import CommentList from './CommentList';
import CommentForm from './CommentForm';

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

type Props = {
  postId: string;
  user: any;
};

export default function CommentSection({ postId, user }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments/post/${postId}`);
      if (!response.ok) throw new Error('خطا تو لود کامنت‌ها');
      const data = await response.json();
      setComments(data);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  return (
    <div className="comment-section">
      <h3>Comments</h3>
      {user ? (
        <CommentForm postId={postId} user={user} parentId={null} onCommentAdded={fetchComments} />
      ) : (
        <p>Sign In to Comment</p>
      )}
      <CommentList comments={comments} postId={postId} user={user} onCommentAdded={fetchComments} />
    </div>
  );
}