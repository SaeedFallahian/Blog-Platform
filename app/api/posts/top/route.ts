import db, { connectDB } from "@/lib/surrealdb";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log('Attempting to connect to SurrealDB...');
    await connectDB();
    console.log('Connected to SurrealDB successfully.');

    // گرفتن همه لایک‌ها
    const likesSql = 'SELECT * FROM likes';
    console.log('Executing likes query:', likesSql);
    const likesResult: any = await db.query(likesSql);
    console.log('Raw likes result:', JSON.stringify(likesResult, null, 2));

    type Like = { postId: string }; // Define the Like type
    let likes: Like[] = [];
    if (Array.isArray(likesResult)) {
      likes = Array.isArray(likesResult[0]) ? likesResult[0] : likesResult;
    } else if (likesResult[0]?.result) {
      likes = likesResult[0].result;
    }

    // ساخت مپ برای شمارش لایک‌ها بر اساس postId
    const likesCountMap: { [key: string]: number } = {};
    likes.forEach((like) => {
      likesCountMap[like.postId] = (likesCountMap[like.postId] || 0) + 1;
    });
    console.log('Likes count map:', JSON.stringify(likesCountMap, null, 2));

    // گرفتن پست‌ها
    const postsSql = `
      SELECT 
        id,
        title,
        content,
        author,
        created_at,
        imageUrl,
        updated_at
      FROM posts
    `;
    console.log('Executing posts query:', postsSql);

    const result: any = await db.query(postsSql);
    console.log('Raw query result:', JSON.stringify(result, null, 2));

    // Define the Post type
    type Post = {
      id: string;
      title: string;
      content: string;
      author: string;
      created_at: string;
      imageUrl?: string;
      updated_at?: string;
      likesCount?: number;
    };
    
        let posts: Post[] = [];
    if (Array.isArray(result)) {
      posts = Array.isArray(result[0]) ? result[0] : result;
    } else if (result[0]?.result) {
      posts = result[0].result;
    } else {
      console.warn('Unexpected query result format:', result);
      posts = [];
    }

    // اضافه کردن likesCount از مپ
    posts = posts.map((post) => ({
      ...post,
      likesCount: likesCountMap[post.id] || 0,
    }));

    // مرتب‌سازی بر اساس تعداد لایک (نزولی) و سپس زمان (صعودی)
    posts = posts
      .sort((a, b) => {
        if ((b.likesCount || 0) === (a.likesCount || 0)) {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return (b.likesCount || 0) - (a.likesCount || 0);
      })
      .slice(0, 3); // انتخاب 3 پست برتر

    console.log('Parsed posts:', JSON.stringify(posts, null, 2));

    posts = posts.filter(
      (post) => post && typeof post === 'object' && post.id && post.title && post.author
    );

    if (posts.length === 0) {
      console.log('No posts found.');
      return NextResponse.json([], { status: 200 });
    }

    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        try {
          console.log(`Fetching user for author ID: ${post.author}`);
          const clerk = await clerkClient();
          const clerkUser = await clerk.users.getUser(post.author);
          const authorName =
            clerkUser.firstName ||
            clerkUser.fullName ||
            clerkUser.emailAddresses[0]?.emailAddress ||
            'ایمیل نامشخص';
          console.log(`Author name for ${post.author}: ${authorName}`);
          return { ...post, authorName, likesCount: post.likesCount };
        } catch (error: any) {
          console.error(`Error fetching user ${post.author}:`, error.message);
          return { ...post, authorName: 'ایمیل نامشخص', likesCount: post.likesCount };
        }
      })
    );

    console.log(`Returning ${enrichedPosts.length} top posts`);
    return NextResponse.json(enrichedPosts, { status: 200 });
  } catch (error: any) {
    console.error('FETCH TOP POSTS ERROR =>', error.message, error.stack);
    return NextResponse.json(
      { error: 'خطا در دریافت پست‌های برتر', details: error.message },
      { status: 500 }
    );
  }
}
