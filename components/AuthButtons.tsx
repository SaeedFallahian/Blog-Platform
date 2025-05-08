'use client';

import { SignInButton, SignedIn, SignedOut, UserButton, SignUpButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function AuthButtons() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';

  return (
    <div className="auth-buttons">
      <SignedIn>
        <div className="auth-buttons">
          <Link href="/create-post">
            <button className="clerk-button create-post">Create New Post</button>
          </Link>
          <UserButton afterSignOutUrl="/" />
          {isAdmin && (
            <Link href="/admin">
              <button className="clerk-button admin-panel">Admin Panel</button>
            </Link>
          )}
        </div>
      </SignedIn>
      <SignedOut>
        <div className="auth-buttons">
          <SignInButton mode="modal">
            <button className="clerk-button sign-in">Sign In</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="clerk-button sign-up">Sign Up</button>
          </SignUpButton>
        </div>
      </SignedOut>
    </div>
  );
}