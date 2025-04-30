import { NextResponse } from 'next/server'
import db, { connectDB } from '@/lib/surrealdb'
import { RecordId } from 'surrealdb'

type Post = {
  id: string
  title: string
  content: string
  author: string
  created_at: string
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const { id } = await params // params نیازی به await نداره
    const postId = new RecordId('posts', id)

    console.log('DELETE ID =>', id)
    console.log('RECORD ID =>', postId.toString())

    // چک کردن وجود پست
    console.log(`Before selecting post: ${postId}`)
    const post = await db.select<Post>(postId)

    if (!post) {
      console.log(`Post not found: ${postId}`)
      return NextResponse.json({ error: 'پست پیدا نشد' }, { status: 404 })
    }

    // اجرای حذف
    console.log(`Before deleting post: ${postId}`)
    const result = await db.delete(postId)
    console.log('DELETE RESULT =>', JSON.stringify(result))

    if (!result) {
      console.log(`Failed to delete post: ${postId}`)
      return NextResponse.json({ error: 'حذف پست ناموفق بود' }, { status: 500 })
    }

    console.log(`Post deleted: ${postId}`)
    return NextResponse.json({ message: 'پست با موفقیت حذف شد' }, { status: 200 })
  } catch (error: any) {
    console.error('DELETE ERROR =>', error.message)
    return NextResponse.json({ error: 'خطا در حذف پست', details: error.message }, { status: 500 })
  }
}
