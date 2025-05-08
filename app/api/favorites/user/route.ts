import { NextResponse } from 'next/server';
import { currentUser, clerkClient } from '@clerk/nextjs/server';
import db, { connectDB } from '@/lib/surrealdb';
import { RecordId } from 'surrealdb';

type Favorite = {
  id: string | RecordId;
  postId: string | RecordId;
  userId: string;
  created_at: string;
};

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  imageUrl?: string;
  authorName: string;
  updated_at?: string;
};

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to view favorites' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    await connectDB();

    // Get all favorites for the user
    const favoritesResult = await db.query<Favorite[]>(
      `SELECT * FROM favorites WHERE userId = $userId`,
      { userId: user.id }
    );

    let favorites: Favorite[] = Array.isArray(favoritesResult[0]) ? favoritesResult[0] : [];
    console.log('Favorites:', favorites); // Log favorites for debugging

    // Extract postIds and convert to RecordId format
    const postIds = favorites.map((fav) => {
      const postId = typeof fav.postId === 'string' ? fav.postId : fav.postId.toString();
      const identifier = postId.startsWith('posts:') ? postId.replace('posts:', '') : postId;
      return new RecordId('posts', identifier);
    });
    console.log('PostIds:', postIds); // Log postIds for debugging

    if (postIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Fetch posts
    let posts: Post[] = [];
    if (query) {
      const postsResult = await db.query<Post[]>(
        `SELECT * FROM posts WHERE id IN $postIds AND (title ~ $query OR content ~ $query)`,
        { postIds, query }
      );
      posts = Array.isArray(postsResult[0]) ? postsResult[0] : [];
    } else {
      const postsResult = await db.query<Post[]>(
        `SELECT * FROM posts WHERE id IN $postIds`,
        { postIds }
      );
      posts = Array.isArray(postsResult[0]) ? postsResult[0] : [];
    }
    console.log('Fetched posts:', posts); // Log posts for debugging

    // Enrich posts with authorName from Clerk
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
          console.log(`Author name: ${authorName}`);
          return { ...post, authorName, favorited_at: favorites.find((fav) => {
            const favPostId = typeof fav.postId === 'string' ? fav.postId : fav.postId.toString();
            return favPostId === post.id;
          })?.created_at };
        } catch (error: any) {
          console.error(`Error fetching user ${post.author}:`, error.message);
          return { ...post, authorName: 'ایمیل نامشخص', favorited_at: favorites.find((fav) => {
            const favPostId = typeof fav.postId === 'string' ? fav.postId : fav.postId.toString();
            return favPostId === post.id;
          })?.created_at };
        }
      })
    );

    console.log('Enriched posts:', enrichedPosts); // Log enriched posts for debugging
    return NextResponse.json(enrichedPosts, { status: 200 });
  } catch (error: any) {
    console.error('FETCH USER FAVORITES ERROR =>', error.message);
    return NextResponse.json(
      { error: 'Error fetching user favorites', details: error.message },
      { status: 500 }
    );
  }
}