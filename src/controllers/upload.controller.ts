import type { Context } from 'hono'
import { uploadLocal, uploadToR2 } from '../lib/upload.js'

const hasR2Config = () =>
  !!process.env.R2_ACCOUNT_ID &&
  !!process.env.R2_ACCESS_KEY_ID &&
  !!process.env.R2_SECRET_ACCESS_KEY &&
  !!process.env.R2_PUBLIC_URL

export const uploadImage = async (c: Context) => {
  const body = await c.req.parseBody()
  const file = body['image']

  if (!file || typeof file === 'string') {
    return c.json({ error: 'Se requiere un archivo de imagen en el campo "image"' }, 400)
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: 'Tipo de archivo no permitido. Usa JPEG, PNG o WebP' }, 422)
  }

  const MAX_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return c.json({ error: 'El archivo supera el límite de 5 MB' }, 422)
  }

  const imageUrl = hasR2Config() ? await uploadToR2(file) : await uploadLocal(file)
  return c.json({ imageUrl })
}
