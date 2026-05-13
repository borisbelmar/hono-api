import type { Context } from 'hono'
import { uploadLocal } from '../lib/upload.js'

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

  const imageUrl = await uploadLocal(file)
  return c.json({ imageUrl })
}
