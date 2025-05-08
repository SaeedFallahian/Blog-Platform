import { NextResponse } from 'next/server'
import { currentUser, clerkClient } from '@clerk/nextjs/server'
import db, { connectDB } from '@/lib/surrealdb'

type Post = {
  id: string
  title: string
  content: string
  author: string
  created_at: string
  imageUrl?: string
  authorName: string
  updated_at?: string
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '0') || 0

    await connectDB()

    let sql = `SELECT * FROM posts ORDER BY created_at DESC`
    if (limit > 0) {
      sql += ` LIMIT ${limit}`
    }

    const result = await db.query<Post[]>(sql)
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
          const authorName =
            clerkUser.firstName ||
            clerkUser.fullName ||
            clerkUser.emailAddresses[0]?.emailAddress ||
            'ایمیل نامشخص'
          console.log(`Author name: ${authorName}`)
          return { ...post, authorName }
        } catch (error: any) {
          console.error(`Error fetching user ${post.author}:`, error.message)
          return { ...post, authorName: 'ایمیل نامشخص' }
        }
      })
    )

    console.log(`Fetched ${enrichedPosts.length} posts`)
    return NextResponse.json(enrichedPosts, { status: 200 })
  } catch (error: any) {
    console.error('FETCH POSTS ERROR =>', error.message)
    return NextResponse.json(
      { error: 'خطا در دریافت پست‌ها', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'کاربر احراز هویت نشده' }, { status: 401 })
    }

    const { title, content, imageUrl } = await request.json()
    if (!title || !content) {
      return NextResponse.json({ error: 'عنوان و محتوا الزامی است' }, { status: 400 })
    }

    await connectDB()
    const newPost = await db.create('posts', {
      title,
      content,
      imageUrl: imageUrl || null,
      author: user.id,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json(newPost, { status: 201 })
  } catch (error: any) {
    console.error('CREATE POST ERROR =>', error.message)
    return NextResponse.json({ error: 'خطا در ایجاد پست', details: error.message }, { status: 500 })
  }
}