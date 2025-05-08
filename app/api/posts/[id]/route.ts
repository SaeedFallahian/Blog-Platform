import { NextRequest, NextResponse } from 'next/server';
import { currentUser, clerkClient } from '@clerk/nextjs/server';
import db, { connectDB } from '@/lib/surrealdb';
import { RecordId } from 'surrealdb';

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  imageUrl?: string;
  updated_at?: string;
  authorName?: string;
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // احراز هویت با Clerk
    const user = await currentUser();
    if (!user) {
      console.log('کاربر احراز هویت نشده');
      return NextResponse.json({ error: 'کاربر احراز هویت نشده' }, { status: 401 });
    }

    // اتصال به SurrealDB
    await connectDB();

    const { id } = params;
    const postId = new RecordId('posts', id);
    console.log(`تلاش برای دریافت پست با شناسه: ${postId}`);

    // استفاده از db.select برای گرفتن پست
    const result = await db.select<Post>(postId);
    console.log('داده پست دریافت‌شده:', result);

    // چک کردن اینکه نتیجه خالی نیست
    if (!result) {
      console.log(`پست پیدا نشد: ${postId}`);
      return NextResponse.json({ error: 'پست پیدا نشد' }, { status: 404 });
    }

    // گرفتن اطلاعات نویسنده از Clerk
    let post: Post = result;
    if (post.author) {
      try {
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(post.author);
        post.authorName = clerkUser.firstName || clerkUser.fullName || clerkUser.emailAddresses[0]?.emailAddress || 'ناشناس';
      } catch (error: any) {
        console.error(`خطا در گرفتن اطلاعات کاربر از Clerk: ${error.message}`);
        post.authorName = 'ناشناس';
      }
    }

    console.log(`پست دریافت شد: ${postId}`);
    return NextResponse.json(post, { status: 200 });
  } catch (error: any) {
    console.error(`خطا در دریافت پست: ${error.message}`);
    return NextResponse.json(
      { error: 'خطا در دریافت پست', جزئیات: error.message },
      { status: 500 }
    );
  }
}