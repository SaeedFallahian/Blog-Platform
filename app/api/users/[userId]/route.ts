import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const { userId } = await params;

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userData = {
      firstName: user.firstName || null,
      fullName: user.fullName || null,
      email: user.emailAddresses[0]?.emailAddress || null,
      imageUrl: user.imageUrl || null,
      updatedAt: user.updatedAt || null,
      createdAt: user.createdAt || null,
    };
    return NextResponse.json(userData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching user' }, { status: 500 });
  }
}