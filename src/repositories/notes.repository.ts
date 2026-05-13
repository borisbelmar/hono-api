import { prisma } from '../lib/prisma.js'
import type { CreateNoteInput, UpdateNoteInput } from '../schemas/notes.schema.js'
import type { Note, Category, Tag } from '../generated/prisma/client.js'

// Tipo extendido: nota con sus relaciones incluidas
export type NoteWithRelations = Note & {
  category: Category
  tags: Array<{ tag: Tag }>
}

// -------------------------------------------------------------------
// Interfaz — el contrato irrompible.
// Todo repositorio de notas, sin importar la tecnología, debe cumplir esto.
// Si mañana cambias Prisma por otro ORM, solo cambias la implementación
// debajo — routes, controllers y schemas no se tocan.
// -------------------------------------------------------------------
interface NoteRepository {
  findAll:  (userId: number)                       => Promise<NoteWithRelations[]>
  findById: (id: number, userId: number)           => Promise<NoteWithRelations | null>
  create:   (data: CreateNoteInput, userId: number)    => Promise<NoteWithRelations>
  update:   (id: number, data: UpdateNoteInput)    => Promise<NoteWithRelations>
  remove:   (id: number)                           => Promise<void>
  addTag:   (noteId: number, tagId: number)        => Promise<void>
  removeTag:(noteId: number, tagId: number)        => Promise<void>
}

// -------------------------------------------------------------------
// Implementación — objeto literal que cumple el contrato usando Prisma.
// -------------------------------------------------------------------

// Include reutilizable para no repetirlo en cada query
const noteInclude = {
  category: true,
  tags: { include: { tag: true } }
} as const

export const notesRepository: NoteRepository = {
  findAll: (userId) =>
    prisma.note.findMany({ where: { userId }, include: noteInclude }),

  findById: (id, userId) =>
    prisma.note.findFirst({ where: { id, userId }, include: noteInclude }),

  create: (data, userId) =>
    prisma.note.create({ data: { ...data, userId }, include: noteInclude }),

  update: (id, data) =>
    prisma.note.update({ where: { id }, data, include: noteInclude }),

  remove: (id) =>
    prisma.note.delete({ where: { id } }).then(() => undefined),

  addTag: (noteId, tagId) =>
    prisma.noteTag.create({ data: { noteId, tagId } }).then(() => undefined),

  removeTag: (noteId, tagId) =>
    prisma.noteTag.delete({ where: { noteId_tagId: { noteId, tagId } } }).then(() => undefined)
}
