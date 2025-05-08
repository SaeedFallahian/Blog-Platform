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
  likesCount: number
}

type LikeStatus = {
  likesCount: number
  userLiked: boolean
}

type FavoriteStatus = {
  favoritesCount: number
  userFavorited: boolean
}

export default function TopPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [error, setError] = useState<string | null>(null)
  const [likeStatuses, setLikeStatuses] = useState<{ [key: string]: LikeStatus }>({})
  const [favoriteStatuses, setFavoriteStatuses] = useState<{ [key: string]: FavoriteStatus }>({})
  const { user } = useUser()
  const router = useRouter()

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  const getRankLabel = (index: number) => {
    switch (index) {
      case 0:
        return '1th Post'
      case 1:
        return '2nd Post'
      case 2:
        return '3rd Post'
      default:
        return ''
    }
  }

  useEffect(() => {
    let isMounted = true

    async function fetchTopPosts() {
      try {
        console.log('[TOP_POSTS_CLIENT] Fetching top posts from: /api/posts/top')
        const response = await fetch('/api/posts/top', { cache: 'no-store' })
        console.log('[TOP_POSTS_CLIENT] Response status:', response.status)
        const responseText = await response.text()
        console.log('[TOP_POSTS_CLIENT] Raw response:', responseText)

        let fetchedPosts: Post[]
        try {
          fetchedPosts = JSON.parse(responseText)
        } catch (parseError) {
          console.error('[TOP_POSTS_CLIENT] JSON parse error:', parseError)
          throw new Error('Invalid response format from API')
        }

        if (!response.ok) {
          console.error('[TOP_POSTS_CLIENT] Error response:', fetchedPosts)
          throw new Error(fetchedPosts.error || 'Error fetching top posts')
        }

        if (!isMounted) return

        console.log('[TOP_POSTS_CLIENT] Fetched posts:', JSON.stringify(fetchedPosts, null, 2))
        setPosts(fetchedPosts)
        setError(null)

        if (fetchedPosts.length === 0) {
          console.log('[TOP_POSTS_CLIENT] No posts returned from API')
          return
        }

        const likeStatuses: { [key: string]: LikeStatus } = {}
        const favoriteStatuses: { [key: string]: FavoriteStatus } = {}
        await Promise.all(
          fetchedPosts.map(async (post: Post) => {
            const postId = post.id.split(':')[1]
            try {
              console.log(`[TOP_POSTS_CLIENT] Fetching likes for post: ${postId}`)
              const likeRes = await fetch(`/api/likes/${postId}`, { cache: 'no-store' })
              if (likeRes.ok) {
                const likeData = await likeRes.json()
                likeStatuses[post.id] = {
                  likesCount: likeData.likesCount || 0,
                  userLiked: likeData.userLiked,
                }
              }
            } catch (err) {
              console.error(`[TOP_POSTS_CLIENT] Error fetching likes for ${postId}:`, err)
            }

            try {
              console.log(`[TOP_POSTS_CLIENT] Fetching favorites for post: ${postId}`)
              const favoriteRes = await fetch(`/api/favorites/${postId}`, { cache: 'no-store' })
              if (favoriteRes.ok) {
                favoriteStatuses[post.id] = await favoriteRes.json()
              }
            } catch (err) {
              console.error(`[TOP_POSTS_CLIENT] Error fetching favorites for ${postId}:`, err)
            }
          })
        )

        if (!isMounted) return

        console.log('[TOP_POSTS_CLIENT] Like statuses:', JSON.stringify(likeStatuses, null, 2))
        console.log(
          '[TOP_POSTS_CLIENT] Favorite statuses:',
          JSON.stringify(favoriteStatuses, null, 2)
        )
        setLikeStatuses(likeStatuses)
        setFavoriteStatuses(favoriteStatuses)
      } catch (err: any) {
        if (!isMounted) return
        console.error('[TOP_POSTS_CLIENT] Fetch top posts error:', err.message)
        setError(err.message || 'Error to Catch Top Post`s')
      }
    }

    console.log('[TOP_POSTS_CLIENT] Triggering fetchTopPosts')
    fetchTopPosts()

    return () => {
      isMounted = false
    }
  }, [user])

  const handleDelete = async (id: string) => {
    try {
      if (!user) {
        setError('لطفاً برای حذف پست وارد شوید')
        return
      }

      const postId = id.split(':')[1]
      console.log(`[TOP_POSTS_CLIENT] Sending DELETE request for post: ${postId}`)
      const response = await fetch(`/api/posts/${postId}/delete`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error deleting post')
      }

      console.log('[TOP_POSTS_CLIENT] DELETE RESPONSE:', await response.json())
      setPosts(posts.filter((post) => post.id !== id))
      setError(null)
    } catch (err: any) {
      console.error('[TOP_POSTS_CLIENT] Delete error:', err.message)
      setError(err.message || 'خطا در حذف پست')
    }
  }

  const handleLike = async (postId: string) => {
    if (!user) {
      setError('لطفاً برای لایک کردن وارد شوید')
      return
    }

    try {
      console.log(`[TOP_POSTS_CLIENT] Sending LIKE request for post: ${postId}`)
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
          likesCount: liked ? prev[postId].likesCount + 1 : prev[postId].likesCount - 1,
          userLiked: liked,
        },
      }))
      await fetchTopPosts()
      setError(null)
    } catch (err: any) {
      setError(err.message || 'خطا در لایک کردن پست')
    }
  }

  const handleFavorite = async (postId: string) => {
    if (!user) {
      setError('لطفاً برای افزودن به علاقه‌مندی‌ها وارد شوید')
      return
    }

    try {
      console.log(`[TOP_POSTS_CLIENT] Sending FAVORITE request for post: ${postId}`)
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
      console.error('[TOP_POSTS_CLIENT] Favorite error:', err.message)
      setError(err.message || 'خطا در افزودن به علاقه‌مندی‌ها')
    }
  }

  return (
    <div>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '16px' }}>Top Post`s</h3>
      {error && (
        <p className="top-post-error" style={{ marginBottom: '16px' }}>
          {error}
        </p>
      )}
      {posts.length === 0 && !error ? (
        <p style={{ color: '#4b5563' }}>There is no Top Posts</p>
      ) : (
        <div className="top-post-grid">
          {posts.map((post, index) => (
            <div key={post.id} className="top-post-card">
              <Link href={`/posts/${post.id.split(':')[1]}`} className="top-post-link">
                <div className="top-koll">
                  <div className="top-rast">
                    <span className="top-post-rank">{getRankLabel(index)}</span>
                    {post.imageUrl && (
                      <img src={post.imageUrl} alt={post.title} className="top-post-img" />
                    )}
                  </div>
                  <div className="top-chap">
                    <h4 className="top-post-title">{post.title}</h4>
                    <p className="top-post-content">{truncateContent(post.content)}</p>
                  </div>
                </div>
              </Link>
              <p className="top-post-meta">
                Author:{' '}
                <Link href={`/profile/${post.author}`} className="top-post-author-link">
                  {post.authorName}
                </Link>
              </p>
              <p className="top-post-meta">
                Post Date: {new Date(post.created_at).toLocaleDateString('en-US')}
              </p>
              {post.updated_at && (
                <p className="top-post-meta">
                  Update {new Date(post.updated_at).toLocaleDateString('en-US')}
                </p>
              )}
              <p className="top-post-meta">
               Likes : {likeStatuses[post.id]?.likesCount || 0}
              </p>
              <div className="top-post-actions">
                <div className="top-post-like">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`top-post-like-btn ${
                      likeStatuses[post.id]?.userLiked ? 'liked' : ''
                    }`}
                    disabled={!user}
                    data-tooltip="Like"
                  >
                    <Heart
                      size={16}
                      fill={likeStatuses[post.id]?.userLiked ? '#dc2626' : 'none'}
                      color={likeStatuses[post.id]?.userLiked ? '#dc2626' : '#4b5563'}
                    />
                  </button>
                  <span className="top-post-like-count">
                    {likeStatuses[post.id]?.likesCount || 0}
                  </span>
                </div>
                <div className="top-post-favorite">
                  <button
                    onClick={() => handleFavorite(post.id)}
                    className={`top-post-favorite-btn ${
                      favoriteStatuses[post.id]?.userFavorited ? 'favorited' : ''
                    }`}
                    disabled={!user}
                    data-tooltip="Fav"
                  >
                    <Star
                      size={16}
                      fill={favoriteStatuses[post.id]?.userFavorited ? '#eab308' : 'none'}
                      color={favoriteStatuses[post.id]?.userFavorited ? '#eab308' : '#4b5563'}
                    />
                  </button>
                  <span className="top-post-favorite-count">
                    {favoriteStatuses[post.id]?.favoritesCount || 0}
                  </span>
                </div>
              </div>
              {user && (
                <div className="top-post-controls">
                  {post.author === user.id && (
                    <button
                      className="top-post-edit-btn"
                      onClick={() => router.push(`/edit-post/${post.id.split(':')[1]}`)}
                    >
                      Edit
                    </button>
                  )}
                  {(post.author === user.id || user.publicMetadata?.role === 'admin') && (
                    <button className="top-post-delete-btn" onClick={() => handleDelete(post.id)}>
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
