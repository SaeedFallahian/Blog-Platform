import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import db, { connectDB } from '@/lib/surrealdb';
import { RecordId } from 'surrealdb';

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  imageUrl?: string;
  updated_at: string;
};

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const postId = new RecordId('posts', id);
    console.log('UPDATE ID =>', id);
    console.log('RECORD ID =>', postId.toString());
    const { title, content, imageUrl } = await req.json();
    const post = await db.select<Post>(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.author !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedPost = await db.merge<Post>(postId, {
      title,
      content,
      imageUrl: imageUrl !== undefined ? imageUrl : post.imageUrl, // بررسی مقدار undefined برای تصویر
      updated_at: new Date().toISOString(),
    });
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }
    return NextResponse.json(updatedPost, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update post', details: error.message }, { status: 500 });
  }
}