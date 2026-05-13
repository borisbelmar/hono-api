import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authMiddleware } from './middlewares/auth.middleware.js'
import authRouter        from './routes/auth.routes.js'
import notesRouter      from './routes/notes.routes.js'
import categoriesRouter from './routes/categories.routes.js'
import tagsRouter       from './routes/tags.routes.js'

type Variables = {
  userId: number
}

const app = new Hono<{ Variables: Variables }>()

// CORS
app.use('*', cors())

// Archivos estáticos (solo desarrollo local)
app.use('/uploads/*', serveStatic({ root: './' }))

// Health check
app.get('/', (c) => c.json({ status: 'ok', message: 'API de Notas — Unidad 3' }))

// Rutas públicas
app.route('/auth', authRouter)

// Rutas protegidas
app.use('/notes/*',      authMiddleware)
app.use('/categories/*', authMiddleware)
app.use('/tags/*',       authMiddleware)

app.route('/notes',       notesRouter)
app.route('/categories',  categoriesRouter)
app.route('/tags',        tagsRouter)

const PORT = Number(process.env.PORT) || 3000

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
