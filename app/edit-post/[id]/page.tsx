'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

type Post = {
  id: string
  title: string
  content: string
  author: string
  created_at: string
}

export default function EditPost() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { id } = useParams()
  const { user } = useUser()

  useEffect(() => {
    async function fetchPost() {
      try {
        if (!user || !id) return

        console.log(`Fetching post with id: ${id}`)
        const response = await fetch(`/api/posts/${id}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'خطا در دریافت پست')
        }

        const post: Post = await response.json()
        setTitle(post.title)
        setContent(post.content)
        setError(null)
      } catch (err: any) {
        console.error(`Fetch post error: ${err.message}`)
        setError(err.message || 'خطا در دریافت پست')
      }
    }

    fetchPost()
  }, [user, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!user) throw new Error('کاربر احراز هویت نشده')

      console.log(`Sending PUT request for post: ${id}`)
      const response = await fetch(`/api/posts/${id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'خطا در به‌روزرسانی پست')
      }

      console.log('UPDATE RESPONSE =>', await response.json())
      router.push('/')
    } catch (err: any) {
      console.error(`Update error: ${err.message}`)
      setError(err.message || 'خطا در به‌روزرسانی پست')
    }
  }

  return (
    <div className="container">
      <h2 className="text-2xl font-bold mb-4">ویرایش پست</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block mb-2">
            عنوان
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان پست"
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="content" className="block mb-2">
            متن
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="متن پست"
            className="w-full p-2 border rounded"
            rows={5}
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          به‌روزرسانی پست
        </button>
      </form>
    </div>
  )
}
