import { Hono } from 'hono'
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  addTagToNote,
  removeTagFromNote
} from '../controllers/notes.controller.js'
import { uploadImage } from '../controllers/upload.controller.js'

const notesRouter = new Hono()

// Rutas base de notas — solo mapean URLs a controllers, sin lógica
notesRouter.get('/',      getNotes)
notesRouter.get('/:id',   getNoteById)
notesRouter.post('/',     createNote)
notesRouter.post('/upload', uploadImage)
notesRouter.patch('/:id', updateNote)
notesRouter.delete('/:id', deleteNote)

// Rutas de etiquetas anidadas en notas
notesRouter.post('/:id/tags',           addTagToNote)
notesRouter.delete('/:id/tags/:tagId',  removeTagFromNote)

export default notesRouter
