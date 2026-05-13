import type { Context, Next } from 'hono'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Token requerido' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const payload = verify(token, JWT_SECRET) as { sub: string; email: string }
    c.set('userId', Number(payload.sub))
    await next()
  } catch {
    return c.json({ error: 'Token inválido o expirado' }, 401)
  }
}
