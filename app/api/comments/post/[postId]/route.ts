import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import db, { connectDB } from '@/lib/surrealdb';
import { clerkClient } from '@clerk/nextjs/server';

type Comment = {
  id: string;
  postId: string;
  content: string;
  author: string;
  created_at: string;
  parentId?: string | null;
  authorName?: string;
  replies?: Comment[];
};

export async function GET(request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const params = await context.params;
    const postId = `posts:${params.postId}`;

    await connectDB();
    const sql = `SELECT * FROM comments WHERE postId = $postId ORDER BY created_at DESC`;
    const result = await db.query<Comment[]>(sql, { postId });

    let comments: Comment[] = Array.isArray(result[0]) ? result[0] : [];

    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(comment.author);
        const authorName = user.firstName || user.emailAddresses[0]?.emailAddress || 'ناشناس';
        return {
          ...comment,
          authorName,
          replies: [],
          id: comment.id.toString(),
          parentId: comment.parentId ? comment.parentId.toString() : null
        };
      })
    );

    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    enrichedComments.forEach((comment) => {
      commentMap.set(comment.id, comment);
    });

    enrichedComments.forEach((comment) => {
      if (!comment.parentId) {
        rootComments.push(comment);
      } else {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(comment);
        }
      }
    });

    return NextResponse.json(rootComments, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'خطا تو سرور', details: error.message }, { status: 500 });
  }
}