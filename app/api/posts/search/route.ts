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

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'کاربر احراز هویت نشده' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query) {
      console.log('No search query provided, returning empty array');
      return NextResponse.json([]);
    }

    console.log(`Search query: ${query}`);

    const result = await db.query<Post[]>(
      `SELECT * FROM posts
       WHERE author = $author
       AND (string::lowercase(title) CONTAINS string::lowercase($query)
            OR string::lowercase(content) CONTAINS string::lowercase($query))`,
      { author: user.id, query }
    );

    let posts: Post[] = [];
    if (Array.isArray(result)) {
      posts = Array.isArray(result[0]) ? result[0] : result;
    } else if (Array.isArray((result[0] as any)?.result)) {
      posts = (result[0] as { result: Post[] }).result;
    }

    console.log(`Found ${posts.length} posts for query: ${query}`);

    return NextResponse.json(posts, { status: 200 });
  } catch (error: any) {
    console.error('🔥 خطای جستجو در SurrealDB:', error.message);
    return NextResponse.json(
      { error: 'خطا در جستجوی پست‌ها', details: error.message },
      { status: 500 }
    );
  }
}