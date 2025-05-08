import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import db, { connectDB } from '@/lib/surrealdb';
import { RecordId } from 'surrealdb';

type Favorite = {
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
      return NextResponse.json({ error: 'Please sign in to add to favorites' }, { status: 401 });
    }

    const { postId } = await params;
    const postIdString = `posts:${postId}`;

    await connectDB();

    // Check if the user has already favorited the post
    const existingFavorite = await db.query<Favorite[]>(
      `SELECT * FROM favorites WHERE postId = $postId AND userId = $userId`,
      { postId: postIdString, userId: user.id }
    );

    let favorites: Favorite[] = Array.isArray(existingFavorite[0]) ? existingFavorite[0] : [];

    if (favorites.length > 0) {
      // User has already favorited, so remove from favorites
      const favoriteId = favorites[0].id;
      let favoriteIdString: string;

      if (typeof favoriteId === 'string') {
        favoriteIdString = favoriteId.includes(':') ? favoriteId.split(':')[1] : favoriteId;
      } else if (favoriteId instanceof RecordId) {
        favoriteIdString = String(favoriteId.id);
      } else {
        throw new Error('Invalid favorite ID format');
      }

      await db.delete(new RecordId('favorites', favoriteIdString));
      return NextResponse.json({ message: 'Removed from favorites', favorited: false }, { status: 200 });
    } else {
      // Add to favorites
      const newFavorite = await db.create('favorites', {
        postId: postIdString,
        userId: user.id,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({ message: 'Added to favorites', favorited: true, favorite: newFavorite }, { status: 201 });
    }
  } catch (error: any) {
    console.error('FAVORITE ERROR =>', error.message);
    return NextResponse.json(
      { error: 'Error processing favorite', details: error.message },
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

    // Get all favorites for the post
    const favoritesResult = await db.query<Favorite[]>(
      `SELECT * FROM favorites WHERE postId = $postId`,
      { postId: postIdString }
    );

    let favorites: Favorite[] = Array.isArray(favoritesResult[0]) ? favoritesResult[0] : [];

    // Check if the current user has favorited the post
    let userFavorited = false;
    if (user) {
      const userFavorite = await db.query<Favorite[]>(
        `SELECT * FROM favorites WHERE postId = $postId AND userId = $userId`,
        { postId: postIdString, userId: user.id }
      );
      userFavorited = Array.isArray(userFavorite[0]) && userFavorite[0].length > 0;
    }

    return NextResponse.json(
      { favoritesCount: favorites.length, userFavorited },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('FETCH FAVORITES ERROR =>', error.message);
    return NextResponse.json(
      { error: 'Error fetching favorites', details: error.message },
      { status: 500 }
    );
  }
}