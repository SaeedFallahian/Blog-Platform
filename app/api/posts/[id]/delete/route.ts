import { NextResponse } from 'next/server';
     import { currentUser } from '@clerk/nextjs/server';
     import db, { connectDB } from '@/lib/surrealdb';
import { RecordId } from 'surrealdb';

     type Post = {
       id: string;
       title: string;
       content: string;
       author: string;
       created_at: string;
     };

     export async function DELETE(req: Request, { params }: { params: { id: string } }) {
       try {
         const user = await currentUser();
         if (!user) {
           return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
         }

         await connectDB();
         const { id } = params;
         const postId = new RecordId('posts', id); // استفاده از RecordId به جای رشته خام

         console.log('DELETE ID =>', id);
         console.log('RECORD ID =>', postId);

         

         // Perform deletion
         console.log(`Before deleting post: ${postId}`);
         await db.delete(postId);
         console.log('DELETE RESULT =>', 'Post deleted');

         console.log(`Post deleted: ${postId}`);
         return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });
       } catch (error: any) {
         console.error('DELETE ERROR =>', error.message);
         return NextResponse.json(
           { error: 'Failed to delete post', details: error.message },
           { status: 500 }
         );
       }
     }