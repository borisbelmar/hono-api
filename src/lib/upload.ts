import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2Client } from './r2.js'
import { randomUUID } from 'crypto'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'

const UPLOADS_DIR = path.join(process.cwd(), 'uploads')

export const uploadToR2 = async (
  file: File,
  folder = 'notes'
): Promise<string> => {
  const ext      = path.extname(file.name) || '.jpg'
  const filename = `${folder}/${randomUUID()}${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())

  await r2Client.send(new PutObjectCommand({
    Bucket:      process.env.R2_BUCKET_NAME!,
    Key:         filename,
    Body:        buffer,
    ContentType: file.type || 'image/jpeg',
  }))

  return `${process.env.R2_PUBLIC_URL}/${filename}`
}

export const uploadLocal = async (file: File): Promise<string> => {
  await mkdir(UPLOADS_DIR, { recursive: true })

  const ext      = path.extname(file.name) || '.jpg'
  const filename = `${randomUUID()}${ext}`
  const filepath = path.join(UPLOADS_DIR, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)

  return `/uploads/${filename}`
}
