import { NextResponse } from 'next/server'
import { currentUser, clerkClient } from '@clerk/nextjs/server'
import db, { connectDB } from '@/lib/surrealdb'

type Post = {
  id: string
  title: string
  content: string
  author: string
  created_at: string
  authorName: string
}

export async function GET(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')?.trim()

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    await connectDB()

    const sql = `
             SELECT * FROM posts
             WHERE title ~ $query OR content ~ $query
             ORDER BY created_at DESC
           `
    const params = { query }

    const result = await db.query<Post[]>(sql, params)
    let posts: Post[] = []
    if (Array.isArray(result)) {
      posts = Array.isArray(result[0]) ? result[0] : result
    } else if (Array.isArray((result[0] as any)?.result)) {
      posts = (result[0] as { result: Post[] }).result
    }

    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        try {
          console.log(`Fetching user for author ID: ${post.author}`)
          const clerk = await clerkClient()
          const clerkUser = await clerk.users.getUser(post.author)
          const authorName = clerkUser.emailAddresses[0]?.emailAddress || 'Unknown email'
          console.log(`Clerk user email: ${authorName}`)
          return { ...post, authorName }
        } catch (error: any) {
          console.error(`Error fetching user ${post.author}:`, error.message)
          return { ...post, authorName: 'Unknown email' }
        }
      })
    )

    console.log(`Found ${enrichedPosts.length} posts for query: ${query}`)
    return NextResponse.json(enrichedPosts, { status: 200 })
  } catch (error: any) {
    console.error('SEARCH ERROR =>', error.message)
    return NextResponse.json(
      { error: 'Failed to search posts', details: error.message },
      { status: 500 }
    )
  }
}
