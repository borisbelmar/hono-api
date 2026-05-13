import type { Context } from 'hono'
import { notesRepository } from '../repositories/notes.repository.js'
import {
  createNoteSchema,
  updateNoteSchema,
  addTagToNoteSchema
} from '../schemas/notes.schema.js'
import { parsePrismaError } from '../lib/prisma-error.js'

// GET /notes
export const getNotes = async (c: Context) => {
  const userId = c.get('userId')
  const notes = await notesRepository.findAll(userId)
  return c.json(notes)
}

// GET /notes/:id
export const getNoteById = async (c: Context) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  const note = await notesRepository.findById(id, userId)
  if (!note) return c.json({ error: 'Nota no encontrada' }, 404)
  return c.json(note)
}

// POST /notes
export const createNote = async (c: Context) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const result = createNoteSchema.safeParse(body)
  if (!result.success) return c.json({ errors: result.error.issues }, 400)
  try {
    const note = await notesRepository.create(result.data, userId)
    return c.json(note, 201)
  } catch (error) {
    const { status, message } = parsePrismaError(error)
    return c.json({ error: message }, status)
  }
}

// PATCH /notes/:id
export const updateNote = async (c: Context) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  const existing = await notesRepository.findById(id, userId)
  if (!existing) return c.json({ error: 'Nota no encontrada' }, 404)

  const body = await c.req.json()
  const result = updateNoteSchema.safeParse(body)
  if (!result.success) return c.json({ errors: result.error.issues }, 400)
  try {
    const note = await notesRepository.update(id, result.data)
    return c.json(note)
  } catch (error) {
    const { status, message } = parsePrismaError(error)
    return c.json({ error: message }, status)
  }
}

// DELETE /notes/:id
export const deleteNote = async (c: Context) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  const existing = await notesRepository.findById(id, userId)
  if (!existing) return c.json({ error: 'Nota no encontrada' }, 404)

  try {
    await notesRepository.remove(id)
    return c.json({ message: 'Nota eliminada' })
  } catch (error) {
    const { status, message } = parsePrismaError(error)
    return c.json({ error: message }, status)
  }
}

// POST /notes/:id/tags
export const addTagToNote = async (c: Context) => {
  const noteId = Number(c.req.param('id'))
  const body = await c.req.json()
  const result = addTagToNoteSchema.safeParse(body)
  if (!result.success) return c.json({ errors: result.error.issues }, 400)
  try {
    await notesRepository.addTag(noteId, result.data.tagId)
    return c.json({ message: 'Etiqueta asociada' })
  } catch (error) {
    const { status, message } = parsePrismaError(error)
    return c.json({ error: message }, status)
  }
}

// DELETE /notes/:id/tags/:tagId
export const removeTagFromNote = async (c: Context) => {
  const noteId = Number(c.req.param('id'))
  const tagId  = Number(c.req.param('tagId'))
  try {
    await notesRepository.removeTag(noteId, tagId)
    return c.json({ message: 'Etiqueta removida' })
  } catch (error) {
    const { status, message } = parsePrismaError(error)
    return c.json({ error: message }, status)
  }
}
