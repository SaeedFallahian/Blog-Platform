'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, Star } from 'lucide-react'

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

type LikeStatus = {
  likesCount: number
  userLiked: boolean
}

type FavoriteStatus = {
  favoritesCount: number
  userFavorited: boolean
}

export default function RecentPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [error, setError] = useState<string | null>(null)
  const [likeStatuses, setLikeStatuses] = useState<{ [key: string]: LikeStatus }>({})
  const [favoriteStatuses, setFavoriteStatuses] = useState<{ [key: string]: FavoriteStatus }>({})
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    async function fetchRecentPosts() {
      try {
        const url = '/api/posts?limit=4'
        console.log(`Fetching recent posts from: ${url}`)
        const response = await fetch(url)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error fetching recent posts')
        }

        const fetchedPosts: Post[] = await response.json()
        console.log('Fetched recent posts:', fetchedPosts)
        setPosts(fetchedPosts)
        setError(null)

        // Fetch like and favorite status for each post
        const likeStatuses: { [key: string]: LikeStatus } = {}
        const favoriteStatuses: { [key: string]: FavoriteStatus } = {}
        await Promise.all(
          fetchedPosts.map(async (post: Post) => {
            const postId = post.id.split(':')[1]
            // Fetch likes
            const likeRes = await fetch(`/api/likes/${postId}`)
            if (likeRes.ok) {
              likeStatuses[post.id] = await likeRes.json()
            }
            // Fetch favorites
            const favoriteRes = await fetch(`/api/favorites/${postId}`)
            if (likeRes.ok) {
              favoriteStatuses[post.id] = await favoriteRes.json()
            }
          })
        )
        console.log('Like statuses:', likeStatuses)
        console.log('Favorite statuses:', favoriteStatuses)
        setLikeStatuses(likeStatuses)
        setFavoriteStatuses(favoriteStatuses)
      } catch (err: any) {
        console.error(`Fetch recent posts error: ${err.message}`)
        setError(err.message || 'Error fetching recent posts')
      }
    }

    fetchRecentPosts()
  }, [user])

  const handleDelete = async (id: string) => {
    try {
      if (!user) {
        setError('Please sign in to delete a post')
        return
      }

      const postId = id.split(':')[1]
      console.log(`Sending DELETE request for post: ${postId}`)

      const response = await fetch(`/api/posts/${postId}/delete`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error deleting post')
      }

      const result = await response.json()
      console.log('DELETE RESPONSE =>', result)

      setPosts(posts.filter((post) => post.id !== id))
      setError(null)
    } catch (err: any) {
      console.error(`Delete error: ${err.message}`)
      setError(err.message || 'Error deleting post')
    }
  }

  const handleLike = async (postId: string) => {
    if (!user) {
      setError('Please sign in to like a post')
      return
    }

    try {
      const response = await fetch(`/api/likes/${postId.split(':')[1]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error liking post')
      }

      const { liked } = await response.json()
      setLikeStatuses((prev) => ({
        ...prev,
        [postId]: {
          likesCount: liked
            ? prev[postId].likesCount + 1
            : prev[postId].likesCount - 1,
          userLiked: liked,
        },
      }))
      setError(null)
    } catch (err: any) {
      console.error(`Like error: ${err.message}`)
      setError(err.message || 'Error liking post')
    }
  }

  const handleFavorite = async (postId: string) => {
    if (!user) {
      setError('Please sign in to add to favorites')
      return
    }

    try {
      const response = await fetch(`/api/favorites/${postId.split(':')[1]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error adding to favorites')
      }

      const { favorited } = await response.json()
      setFavoriteStatuses((prev) => ({
        ...prev,
        [postId]: {
          favoritesCount: favorited
            ? prev[postId].favoritesCount + 1
            : prev[postId].favoritesCount - 1,
          userFavorited: favorited,
        },
      }))
      setError(null)
    } catch (err: any) {
      console.error(`Favorite error: ${err.message}`)
      setError(err.message || 'Error adding to favorites')
    }
  }

  // Function to truncate content
  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  return (
    <div>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '16px' }}>
        Recent Posts
      </h3>
      {error && (
        <p className="recent-post-error" style={{ marginBottom: '16px' }}>
          {error}
        </p>
      )}
      {posts.length === 0 && !error ? (
        <p style={{ color: '#4b5563' }}>No Recent Posts Found</p>
      ) : (
        <div className="recent-post-grid">
          {posts.map((post) => (
            <div key={post.id} className="recent-post-card">
              <Link href={`/posts/${post.id.split(':')[1]}`} className="recent-post-link">
                {post.imageUrl && (
                  <img src={post.imageUrl} alt={post.title} className="recent-post-img" />
                )}
                <h4 className="recent-post-title">{post.title}</h4>
                <p className="recent-post-content">{truncateContent(post.content)}</p>
              </Link>
              <p className="recent-post-meta">
                Author:{' '}
                <Link href={`/profile/${post.author}`} className="recent-post-author-link">
                  {post.authorName}
                </Link>
              </p>
              <p className="recent-post-meta">
                Posted: {new Date(post.created_at).toLocaleDateString('en-US')}
              </p>
              <div className="recent-post-actions">
                <div className="recent-post-like">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`recent-post-like-btn ${likeStatuses[post.id]?.userLiked ? 'liked' : ''}`}
                    disabled={!user}
                    data-tooltip="Like"
                  >
                    <Heart
                      size={16}
                      fill={likeStatuses[post.id]?.userLiked ? '#dc2626' : 'none'}
                      color={likeStatuses[post.id]?.userLiked ? '#dc2626' : '#4b5563'}
                    />
                  </button>
                  <span className="recent-post-like-count">{likeStatuses[post.id]?.likesCount || 0}</span>
                </div>
                <div className="recent-post-favorite">
                  <button
                    onClick={() => handleFavorite(post.id)}
                    className={`recent-post-favorite-btn ${favoriteStatuses[post.id]?.userFavorited ? 'favorited' : ''}`}
                    disabled={!user}
                    data-tooltip="Favorite"
                  >
                    <Star
                      size={16}
                      fill={favoriteStatuses[post.id]?.userFavorited ? '#eab308' : 'none'}
                      color={favoriteStatuses[post.id]?.userFavorited ? '#eab308' : '#4b5563'}
                    />
                  </button>
                  <span className="recent-post-favorite-count">{favoriteStatuses[post.id]?.favoritesCount || 0}</span>
                </div>
              </div>
              {user && (
                <div className="recent-post-controls">
                  {post.author === user.id && (
                    <button
                      className="recent-post-edit-btn"
                      onClick={() => router.push(`/edit-post/${post.id.split(':')[1]}`)}
                    >
                      Edit
                    </button>
                  )}
                  {(post.author === user.id ||
                    (user.publicMetadata?.role === 'admin')) && (
                    <button className="recent-post-delete-btn" onClick={() => handleDelete(post.id)}>
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}