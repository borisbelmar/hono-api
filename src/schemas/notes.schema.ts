// Zod v4: import * as z from 'zod'
import * as z from 'zod'

// --- Schemas de validación ---

export const createNoteSchema = z.object({
  title:      z.string().min(1).max(100),
  content:    z.string().min(1),
  categoryId: z.number().int().positive(),
  imageUrl:   z.string().url().optional(),
  latitude:   z.number().min(-90).max(90).optional(),
  longitude:  z.number().min(-180).max(180).optional(),
})

export const updateNoteSchema = z.object({
  title:     z.string().min(1).max(100).optional(),
  content:   z.string().min(1).optional(),
  imageUrl:  z.string().url().optional(),
  latitude:  z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50)
})

export const createTagSchema = z.object({
  name: z.string().min(1).max(50)
})

export const addTagToNoteSchema = z.object({
  tagId: z.number().int().positive()
})

// --- Tipos inferidos desde los schemas ---
// Una sola fuente de verdad: el schema define validación en runtime y el tipo en compile time.

export type CreateNoteInput   = z.infer<typeof createNoteSchema>
export type UpdateNoteInput   = z.infer<typeof updateNoteSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type CreateTagInput    = z.infer<typeof createTagSchema>
export type AddTagToNoteInput = z.infer<typeof addTagToNoteSchema>
