# API de Notas — Unidad 3

API REST con autenticación JWT, subida de imágenes y soporte para despliegue en producción. Las notas ahora pertenecen a usuarios, pueden incluir imágenes y coordenadas GPS.

**Stack:** Node.js · TypeScript · Hono · Prisma 7 · Zod · bcryptjs · JWT · PostgreSQL · Docker · Cloudflare R2

---

## Requisitos previos

- Node.js 22.x
- Docker Desktop corriendo
- Corepack habilitado (`corepack enable`)

---

## Instalación y puesta en marcha

### 1. Instalar dependencias

```bash
yarn install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y ajusta los valores si es necesario:

```bash
cp .env.example .env
```

El `.env` debe tener al menos estas variables:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notesdb"
PORT=3000
JWT_SECRET="una-clave-secreta-larga-y-aleatoria"
```

Para subida de imágenes (opcional en desarrollo), agrega las credenciales de Cloudflare R2:

```
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="notes-app"
R2_PUBLIC_URL=""
```

Sin R2 configurado, las imágenes se guardan localmente en `uploads/`.

### 3. Levantar la base de datos

```bash
docker compose up -d
```

### 4. Generar el cliente de Prisma

```bash
yarn prisma:generate
```

### 5. Correr las migraciones

```bash
yarn prisma:migrate
```

Crea las tablas en la base de datos. La primera vez pedirá un nombre para la migración, puedes escribir `init`.

### 6. Iniciar el servidor

```bash
yarn dev
```

El servidor queda disponible en `http://localhost:3000`.

---

## Scripts disponibles

| Script | Descripción |
|---|---|
| `yarn dev` | Servidor en modo desarrollo con hot reload |
| `yarn build` | Compila el proyecto con tsdown |
| `yarn start` | Corre el build compilado |
| `yarn prisma:generate` | Regenera el cliente Prisma desde el schema |
| `yarn prisma:migrate` | Crea y aplica migraciones en desarrollo |
| `yarn prisma:deploy` | Aplica migraciones existentes en producción |
| `yarn prisma:studio` | Abre Prisma Studio (interfaz visual de la BD) |

---

## Flujo de trabajo diario

```bash
docker compose up -d       # 1. Levantar la BD
yarn dev                   # 2. Iniciar el servidor
# ... trabajar ...
docker compose stop        # 3. Apagar la BD al terminar
```

Solo correr `yarn prisma:migrate` cuando hay cambios en `prisma/schema.prisma`.

---

## Endpoints

### Autenticación (públicos)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Crear cuenta, devuelve token JWT |
| POST | `/auth/login` | Login, devuelve token JWT |

### Notas (requieren autenticación)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/notes` | Lista notas del usuario autenticado |
| GET | `/notes/:id` | Detalle de una nota (solo del usuario) |
| POST | `/notes` | Crea una nota (con imageUrl, latitude, longitude opcionales) |
| POST | `/notes/upload` | Sube una imagen, devuelve URL |
| PATCH | `/notes/:id` | Actualiza una nota (solo del usuario) |
| DELETE | `/notes/:id` | Elimina una nota (solo del usuario) |
| POST | `/notes/:id/tags` | Asocia un tag a una nota |
| DELETE | `/notes/:id/tags/:tagId` | Desasocia un tag de una nota |

### Categorías (requieren autenticación)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/categories` | Lista todas las categorías |
| GET | `/categories/:id` | Detalle de una categoría |
| POST | `/categories` | Crea una categoría |
| PATCH | `/categories/:id` | Actualiza una categoría |
| DELETE | `/categories/:id` | Elimina una categoría |

### Tags (requieren autenticación)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/tags` | Lista todos los tags |
| GET | `/tags/:id` | Detalle de un tag |
| POST | `/tags` | Crea un tag |
| DELETE | `/tags/:id` | Elimina un tag |

---

## Arquitectura N-Layer

El código está organizado en capas. Cada capa tiene una única responsabilidad y solo se comunica con la capa inmediatamente debajo.

```
Request → Middleware → Routes → Controller → Repository → Base de datos
```

### `src/middlewares/`

Interceptores que se ejecutan antes del controller. El middleware de autenticación verifica el token JWT y agrega el `userId` al contexto de Hono.

```
src/middlewares/
└── auth.middleware.ts    ← verifica JWT, inyecta userId
```

### `src/schemas/`

Define la forma que deben tener los datos de entrada usando Zod. Es la única fuente de verdad para validación en runtime y tipos en compile time.

```
src/schemas/
├── auth.schema.ts        ← register + login
└── notes.schema.ts       ← schemas de notas, categorías, tags
```

### `src/repositories/`

Única capa que habla con la base de datos.

```
src/repositories/
├── users.repository.ts      ← CRUD de usuarios
├── notes.repository.ts      ← CRUD de notas (filtradas por userId)
├── categories.repository.ts ← CRUD de categorías
└── tags.repository.ts       ← CRUD de tags
```

### `src/controllers/`

Coordina el flujo de cada endpoint: extrae datos del request, valida con Zod, llama al repository y devuelve la respuesta.

```
src/controllers/
├── auth.controller.ts      ← register + login
├── notes.controller.ts     ← CRUD de notas (recibe userId del contexto)
├── categories.controller.ts
├── tags.controller.ts
└── upload.controller.ts    ← subida de imágenes
```

### `src/routes/`

Solo mapea URLs a funciones de controller.

```
src/routes/
├── auth.routes.ts          ← POST /auth/register, /auth/login
├── notes.routes.ts         ← /notes, /notes/:id, /notes/upload, etc.
├── categories.routes.ts    ← /categories, /categories/:id
└── tags.routes.ts          ← /tags, /tags/:id
```

### `src/lib/`

Utilidades compartidas.

```
src/lib/
├── prisma.ts          ← singleton de PrismaClient
├── prisma-error.ts    ← helper de errores Prisma → HTTP
├── r2.ts              ← cliente S3 para Cloudflare R2
└── upload.ts          ← uploadToR2 + uploadLocal
```

### `src/index.ts`

Entry point. Configura CORS, monta middlewares de autenticación, rutas públicas y protegidas.

---

## Autenticación

La API usa JWT (JSON Web Tokens) con bcrypt para hashing de contraseñas.

### Flujo

1. `POST /auth/register` — crea usuario, devuelve `{ token }`
2. `POST /auth/login` — verifica credenciales, devuelve `{ token }`
3. En cada request protegido, enviar: `Authorization: Bearer <token>`
4. El token expira en 7 días

### Seguridad

- Las contraseñas se guardan como hash bcrypt (saltRounds: 10)
- El mismo mensaje "Credenciales inválidas" para email inexistente y contraseña incorrecta (no leaks de información)
- El payload del JWT incluye solo `sub` (userId) y `email`

---

## Subida de imágenes

### Local (desarrollo)

Sin R2 configurado, las imágenes se guardan en `uploads/` y se sirven como estáticos:

```bash
curl -X POST http://localhost:3000/notes/upload \
  -H "Authorization: Bearer <token>" \
  -F "image=@foto.jpg"
```

### Cloudflare R2 (producción)

Configura las variables `R2_*` en el `.env`. La subida se hace al bucket configurado y devuelve una URL pública.

Tipos aceptados: `image/jpeg`, `image/png`, `image/webp`. Tamaño máximo: 5 MB.

---

## Modelo de datos

```prisma
model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  notes        Note[]
}

model Note {
  id         Int       @id @default(autoincrement())
  title      String
  content    String
  imageUrl   String?
  latitude   Float?
  longitude  Float?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  user       User      @relation(fields: [userId], references: [id])
  userId     Int
  category   Category  @relation(fields: [categoryId], references: [id])
  categoryId Int
  tags       NoteTag[]
}
```

---

## Despliegue en Render

### 1. Crear base de datos PostgreSQL en Render

- Nueva instancia de PostgreSQL
- Copiar la **Internal Database URL**

### 2. Crear Web Service

- Conectar repositorio de GitHub
- **Build Command:** `yarn install && yarn build && yarn prisma generate`
- **Start Command:** `yarn start`
- **Pre-Deploy Command:** `yarn prisma:deploy`

### 3. Variables de entorno

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Internal Database URL de Render |
| `JWT_SECRET` | Clave secreta (generar con `openssl rand -base64 32`) |
| `R2_*` | Credenciales de Cloudflare R2 |
| `NODE_ENV` | `production` |

---

## Estructura del proyecto

```
├── bruno/                  ← colección Bruno para probar la API
├── prisma/
│   ├── schema.prisma       ← modelos: User, Note, Category, Tag, NoteTag
│   └── migrations/         ← migraciones (commiteadas para producción)
├── prisma.config.ts        ← configuración de Prisma 7
├── src/
│   ├── index.ts
│   ├── middlewares/
│   ├── schemas/
│   ├── repositories/
│   ├── controllers/
│   ├── routes/
│   ├── lib/
│   └── generated/          ← cliente Prisma generado
├── docker-compose.yml
├── uploads/                ← imágenes locales (solo desarrollo)
├── .env                    ← no se sube al repo
├── .env.example
└── tsconfig.json
```

---

## Probar la API con Bruno

La carpeta `bruno/` contiene una colección lista para usar con [Bruno](https://www.usebruno.com/). Abre Bruno, importa la carpeta y selecciona el entorno **Local**.

El orden recomendado:

1. **Register** o **Login** (el token se guarda automáticamente como secreto)
2. **Create Category**
3. **Create Tag**
4. **Upload Image** (seleccionar archivo en el Body tab)
5. **Create Note** (usa el categoryId y imageUrl obtenidos)
6. **Get Notes** (solo las del usuario autenticado)

Los endpoints protegidos usan `auth:bearer { token: {{token}} }` y el token se persiste como `vars:secret` en el environment.

---

## Errores comunes

| Error | Causa | Solución |
|---|---|---|
| `Can't reach database server` | BD no corriendo | `docker compose up -d` |
| `The table does not exist` | Migraciones no aplicadas | `yarn prisma:migrate` |
| `secretOrPrivateKey must have a value` | `JWT_SECRET` no definida | Verificar `.env` |
| `401 Token requerido` | Falta header `Authorization` | Enviar `Bearer <token>` |
| `Credenciales inválidas` | Email o password incorrectos | Verificar credenciales |
| `Tipo de archivo no permitido` | Formato de imagen no soportado | Usar JPEG, PNG o WebP |
| `El archivo supera el límite de 5 MB` | Imagen muy grande | Comprimir o reducir tamaño |
