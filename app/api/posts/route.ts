import { NextResponse } from 'next/server';
import { currentUser, clerkClient } from '@clerk/nextjs/server';
import db, { connectDB } from '@/lib/surrealdb';

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  authorName: string;
};

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'کاربر احراز هویت نشده' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const allPosts = searchParams.get('all') === 'true';

    let sql = '';
    let params: Record<string, string> = {};

    if (allPosts) {
      sql = `SELECT * FROM posts ORDER BY created_at DESC`;
    } else {
      sql = `SELECT * FROM posts WHERE author = $author ORDER BY created_at DESC`;
      params = { author: user.id };
    }

    const result = await db.query<Post[]>(sql, params);
    let posts: Post[] = [];
    if (Array.isArray(result)) {
      posts = Array.isArray(result[0]) ? result[0] : result;
    } else if (Array.isArray((result[0] as any)?.result)) {
      posts = (result[0] as { result: Post[] }).result;
    }

    // گرفتن ایمیل نویسنده برای هر پست
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        try {
          console.log(`Fetching user for author ID: ${post.author}`);
          const clerk = await clerkClient();
          const clerkUser = await clerk.users.getUser(post.author);
          const authorName = clerkUser.emailAddresses[0]?.emailAddress || 'ایمیل نامشخص';
          console.log(`Clerk user email: ${authorName}`);
          return { ...post, authorName };
        } catch (error: any) {
          console.error(`Error fetching user ${post.author}:`, error.message);
          return { ...post, authorName: 'ایمیل نامشخص' };
        }
      })
    );

    console.log(`Fetched ${enrichedPosts.length} posts (allPosts: ${allPosts})`);

    return NextResponse.json(enrichedPosts, { status: 200 });
  } catch (error: any) {
    console.error('FETCH POSTS ERROR =>', error.message);
    return NextResponse.json(
      { error: 'خطا در دریافت پست‌ها', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'کاربر احراز هویت نشده' }, { status: 401 });
    }

    const { title, content } = await request.json();
    if (!title || !content) {
      return NextResponse.json({ error: 'عنوان و متن الزامی هستند' }, { status: 400 });
    }

    await connectDB();
    const newPost = await db.create('posts', {
      title,
      content,
      author: user.id,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'خطا در ایجاد پست', details: error.message }, { status: 500 });
  }
}