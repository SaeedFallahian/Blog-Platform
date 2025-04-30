import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import db, { connectDB } from '@/lib/surrealdb';

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
};

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'کاربر احراز هویت نشده' }, { status: 401 });
    }

    const params = await context.params;
    const postId = `posts:${params.id}`;
    console.log(`Attempting to fetch post: ${postId}`);

    await connectDB();
    const post = await db.select<Post>(postId);

    if (!post) {
      console.log(`Post not found: ${postId}`);
      return NextResponse.json({ error: 'پست پیدا نشد' }, { status: 404 });
    }

    console.log(`Post fetched: ${postId}`);
    return NextResponse.json(post);
  } catch (error: any) {
    console.error(`Error fetching post: ${error.message}`);
    return NextResponse.json({ error: 'خطا در دریافت پست', details: error.message }, { status: 500 });
  }
}