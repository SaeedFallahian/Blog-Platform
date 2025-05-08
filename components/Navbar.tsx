'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import AuthButtons from './AuthButtons'
import { useTheme } from '@/app/components/ThemeProvider'

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-btn"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon size={24} className="theme-toggle-icon" />
      ) : (
        <Sun size={24} className="theme-toggle-icon" />
      )}
    </button>
  )
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isSignedIn } = useUser()

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <nav className="site-nav">
      <div className="container">
        {/* Logo */}
        <Link href="/" className="logo">
          Blog Platform
        </Link>

        {/* Desktop Menu */}
        <div className="desktop-menu">
          <Link href="/">Home</Link>
          <Link href="/all-posts">All Posts</Link>
          {isSignedIn && <Link href="/favorites">Favorites</Link>}
          <AuthButtons />
          <ThemeToggleButton />
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
          {isSignedIn && (
            <Link href="/favorites" onClick={toggleMenu}>
              Favorites
            </Link>
          )}
          <AuthButtons />
          <ThemeToggleButton />
        </div>
      </div>
    </nav>
  )
}