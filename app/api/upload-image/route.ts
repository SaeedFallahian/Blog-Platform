// فایل: app/api/upload-image/route.ts
import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

export async function POST(req: Request) {
  try {
    console.log('📩 آپلود شروع شد')

    const formData = await req.formData()
    const file = formData.get('image') as File

    if (!file) {
      console.log('⚠️ فایل پیدا نشد')
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    console.log('✅ فایل دریافت شد:', file.name)

    const uploadResult = await new Promise<{ url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'blog-posts' }, (error, result) => {
          // تغییر: استفاده از "blog-posts"
          if (error || !result) {
            console.log('❌ خطا در cloudinary:', error)
            return reject(error)
          }
          resolve({ url: result.secure_url })
        })
        .end(buffer)
    })

    console.log('✅ آپلود موفق:', uploadResult.url)

    return NextResponse.json({ url: uploadResult.url }, { status: 200 })
  } catch (err: any) {
    console.error('❌ خطای کلی سرور در upload route:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
