import { NextResponse } from 'next/server';
  import { clerkClient } from '@clerk/nextjs/server';
  import db, { connectDB } from '@/lib/surrealdb';

  type Post = {
    id: string;
    title: string;
    content: string;
    author: string;
    created_at: string;
    imageUrl?: string;
    authorName: string;
  };

  export async function GET(req: Request, { params }: { params: { authorId: string } }) {
    try {
      const { authorId } = params;

      await connectDB();

      const sql = `SELECT * FROM posts WHERE author = $author ORDER BY created_at DESC`;
      const result = await db.query<Post[]>(sql, { author: authorId });
      let posts: Post[] = [];
      if (Array.isArray(result)) {
        posts = Array.isArray(result[0]) ? result[0] : result;
      } else if (Array.isArray((result[0] as any)?.result)) {
        posts = (result[0] as { result: Post[] }).result;
      }

      const enrichedPosts = await Promise.all(
        posts.map(async (post) => {
          try {
            console.log(`Fetching user for author ID: ${post.author}`);
            const clerk = await clerkClient();
            const clerkUser = await clerk.users.getUser(post.author);
            const authorName =
              clerkUser.firstName || clerkUser.fullName || clerkUser.emailAddresses[0]?.emailAddress || 'ایمیل نامشخص';
            console.log(`Author name: ${authorName}`);
            return { ...post, authorName };
          } catch (error: any) {
            console.error(`Error fetching user ${post.author}:`, error.message);
            return { ...post, authorName: 'ایمیل نامشخص' };
          }
        })
      );

      console.log(`Fetched ${enrichedPosts.length} posts for author ${authorId}`);
      return NextResponse.json(enrichedPosts, { status: 200 });
    } catch (error: any) {
      console.error('FETCH AUTHOR POSTS ERROR =>', error.message);
      return NextResponse.json(
        { error: 'خطا در دریافت پست‌ها', details: error.message },
        { status: 500 }
      );
    }
  }