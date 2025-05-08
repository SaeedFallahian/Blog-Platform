import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import db, { connectDB } from '@/lib/surrealdb';
import { RecordId } from 'surrealdb';

type Comment = {
  id: string;
  postId: string;
  content: string;
  author: string;
  created_at: string;
  parentId?: string | null;
};

export async function DELETE(req: Request, { params }: { params: { commentId: string } }) {
  try {
    const user = await currentUser();
    if (!user) {
      console.error('DELETE ERROR => No user authenticated');
      return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
    }

    await connectDB();
    const { commentId } = params;
    if (!commentId) {
      console.error('DELETE ERROR => Invalid commentId:', commentId);
      return NextResponse.json({ error: 'شناسه کامنت نامعتبر است' }, { status: 400 });
    }

    const recordId = new RecordId('comments', commentId);
    console.log('DELETE ID =>', commentId);
    console.log('RECORD ID =>', recordId);

    // Fetch comment to check ownership
    console.log(`Before fetching comment: ${recordId}`);
    const comment = await db.select<Comment>(recordId);
    if (!comment) {
      console.error('DELETE ERROR => Comment not found:', recordId);
      return NextResponse.json({ error: 'کامنت یافت نشد' }, { status: 404 });
    }

    console.log('Comment author:', comment.author, 'User ID:', user.id);
    if (comment.author !== user.id) {
      console.error('DELETE ERROR => Unauthorized: User does not own comment');
      return NextResponse.json({ error: 'فقط نویسنده کامنت می‌تواند آن را حذف کند' }, { status: 403 });
    }

    // Perform deletion
    console.log(`Before deleting comment: ${recordId}`);
    await db.delete(recordId);
    console.log('DELETE RESULT =>', 'Comment deleted');

    console.log(`Comment deleted: ${recordId}`);
    return NextResponse.json({ message: 'کامنت با موفقیت حذف شد' }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE ERROR =>', error.message);
    return NextResponse.json(
      { error: 'خطا در حذف کامنت', details: error.message },
      { status: 500 }
    );
  }
}