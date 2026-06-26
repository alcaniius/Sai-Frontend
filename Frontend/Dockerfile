# ============================================
# SAI Frontend - Dockerfile de Producción
# ============================================

# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Instalar pnpm
RUN corepack enable pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Instalar pnpm
RUN corepack enable pnpm

# Copiar dependencias y código fuente
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Pasar variables de entorno para el build
ARG NEXT_PUBLIC_API_URL=http://backsai.jjsoftech.com/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build de Next.js
RUN pnpm build

# Aplanar standalone (mover contenido del subdirectorio a la raíz)
RUN wrapper=$(ls -d .next/standalone/*/ | head -1) && \
    mv $wrapper* .next/standalone/ 2>/dev/null; \
    mv $wrapper.[!.]* .next/standalone/ 2>/dev/null; \
    rmdir $wrapper 2>/dev/null; \
    true

# Stage 3: Producción
FROM node:22-alpine AS runner
WORKDIR /app

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./

# Variables de entorno por defecto
ENV PORT=3002
ENV NODE_ENV=production

# Exponer puerto
EXPOSE 3002

# Cambiar a usuario no-root
USER nextjs

# Comando de inicio
CMD ["node", "server.js"]
