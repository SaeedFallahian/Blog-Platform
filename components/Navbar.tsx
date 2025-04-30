'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import AuthButtons from './AuthButtons';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav>
      <div className="container">
        {/* Logo */}
        <Link href="/" className="logo">
          Blog Platform
        </Link>

        {/* Desktop Menu */}
        <div className="desktop-menu">
          <Link href="/">Home</Link>
          <Link href="/all-posts">All Posts</Link>
          <AuthButtons />
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-button" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
        <div className="container">
          <Link href="/" onClick={toggleMenu}>
            Home
          </Link>
          <Link href="/all-posts" onClick={toggleMenu}>
            All Posts
          </Link>
          <AuthButtons />
        </div>
      </div>
    </nav>
  );
}