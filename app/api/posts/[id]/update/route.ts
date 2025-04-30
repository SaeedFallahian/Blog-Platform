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
};

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'کاربر احراز هویت نشده' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params; // params نیازی به await نداره
    const postId = new RecordId('posts', id);

    console.log('UPDATE ID =>', id);
    console.log('RECORD ID =>', postId.toString());

    // دریافت داده‌های ورودی
    const { title, content } = await req.json();
    if (!title || !content) {
      console.log('Missing title or content');
      return NextResponse.json({ error: 'عنوان و متن الزامی هستند' }, { status: 400 });
    }

    // چک کردن وجود پست
    console.log(`Before selecting post: ${postId}`);
    const post = await db.select<Post>(postId);
    if (!post) {
      console.log(`Post not found: ${postId}`);
      return NextResponse.json({ error: 'پست پیدا نشد' }, { status: 404 });
    }

    // آپدیت پست
    console.log(`Before updating post: ${postId}`);
    const updatedPost = await db.merge(postId, {
      title,
      content,
      updated_at: new Date().toISOString(),
    });
    console.log('UPDATE RESULT =>', JSON.stringify(updatedPost));

    if (!updatedPost) {
      console.log(`Failed to update post: ${postId}`);
      return NextResponse.json({ error: 'به‌روزرسانی پست ناموفق بود' }, { status: 500 });
    }

    console.log(`Post updated: ${postId}`);
    return NextResponse.json(updatedPost, { status: 200 });
  } catch (error: any) {
    console.error('UPDATE ERROR =>', error.message);
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی پست', details: error.message },
      { status: 500 }
    );
  }
}