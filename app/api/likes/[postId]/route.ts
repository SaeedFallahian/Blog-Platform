import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import db, { connectDB } from '@/lib/surrealdb';
import { RecordId } from 'surrealdb';

type Like = {
  id: string | RecordId;
  postId: string;
  userId: string;
  created_at: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
    }

    const { postId } = await params;
    const postIdString = `posts:${postId}`;

    await connectDB();

    // Check if the user has already liked the post
    const existingLike = await db.query<Like[]>(
      `SELECT * FROM likes WHERE postId = $postId AND userId = $userId`,
      { postId: postIdString, userId: user.id }
    );

    let likes: Like[] = Array.isArray(existingLike[0]) ? existingLike[0] : [];

    if (likes.length > 0) {
      // User has already liked, so unlike (delete the like)
      const likeId = likes[0].id;
      let likeIdString: string;

      if (typeof likeId === 'string') {
        likeIdString = likeId.includes(':') ? likeId.split(':')[1] : likeId;
      } else if (likeId instanceof RecordId) {
        likeIdString = String(likeId.id);
      } else {
        throw new Error('Invalid like ID format');
      }

      await db.delete(new RecordId('likes', likeIdString));
      return NextResponse.json({ message: 'Like removed', liked: false }, { status: 200 });
    } else {
      // Create a new like
      const newLike = await db.create('likes', {
        postId: postIdString,
        userId: user.id,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({ message: 'Like added', liked: true, like: newLike }, { status: 201 });
    }
  } catch (error: any) {
    console.error('LIKE ERROR =>', error.message);
    return NextResponse.json(
      { error: 'Error processing like', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await currentUser();
    const { postId } = await params;
    const postIdString = `posts:${postId}`;

    await connectDB();

    // Get all likes for the post
    const likesResult = await db.query<Like[]>(
      `SELECT * FROM likes WHERE postId = $postId`,
      { postId: postIdString }
    );

    let likes: Like[] = Array.isArray(likesResult[0]) ? likesResult[0] : [];

    // Check if the current user has liked the post
    let userLiked = false;
    if (user) {
      const userLike = await db.query<Like[]>(
        `SELECT * FROM likes WHERE postId = $postId AND userId = $userId`,
        { postId: postIdString, userId: user.id }
      );
      userLiked = Array.isArray(userLike[0]) && userLike[0].length > 0;
    }

    return NextResponse.json(
      { likesCount: likes.length, userLiked },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('FETCH LIKES ERROR =>', error.message);
    return NextResponse.json(
      { error: 'Error fetching likes', details: error.message },
      { status: 500 }
    );
  }
}