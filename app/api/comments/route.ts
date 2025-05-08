import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import db, { connectDB } from '@/lib/surrealdb';
import { RecordId } from 'surrealdb';

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const { postId, content, parentId } = await request.json();
    if (!postId || !content) {
      return NextResponse.json({ error: 'پست یا محتوا خالیه' }, { status: 400 });
    }

    const postIdString = postId.startsWith('posts:') ? postId : `posts:${postId}`;
    let parentIdRecord = null;
    if (parentId) {
      const parentIdString = parentId.startsWith('comments:') ? parentId : `comments:${parentId}`;
      parentIdRecord = new RecordId('comments', parentIdString.split(':')[1]);
    }

    await connectDB();
    const newComment = await db.create('comments', {
      postId: postIdString,
      content,
      author: user.id,
      created_at: new Date().toISOString(),
      parentId: parentIdRecord,
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'خطا تو سرور', details: error.message }, { status: 500 });
  }
}