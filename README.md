# SAI Frontend - Sistema Ambiental Integrado

Frontend del Sistema Ambiental Integrado (SAI) construido con Next.js 16.

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 16 | Framework React (App Router) |
| React | 19 | UI library |
| Tailwind CSS | 4 | Estilos |
| Zustand | 5 | Estado global |
| TanStack Query | 5 | Fetching y caché |
| React Hook Form | 7 | Formularios |
| Zod | 4 | Validación |
| Axios | 1 | HTTP client |
| Lucide React | 1 | Iconos |
| Recharts | 3 | Gráficas |
| Vitest | 4 | Testing |
| @testing-library | 16 | Testing de componentes |

## Instalación

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
```

## Variables de Entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_NAME=SAI - Sistema Ambiental Integrado
```

## Ejecución

```bash
# Desarrollo
pnpm dev

# Build para producción
npx next build

# Tests
npx vitest run

# Tests con coverage
npx vitest run --coverage
```

## Testing (12 tests passando)

### Suites
| Archivo | Tests | Descripción |
|---------|-------|-------------|
| `authStore.test.ts` | 4 | Tests del store de Zustand (setAuth, logout, updateUser) |
| `api.test.ts` | 2 | Tests de configuración de Axios |
| `services.test.ts` | 6 | Tests de servicios API (auth, documents, environmental) |

### Configuración

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
```

### Ejecutar Tests

```bash
# Todos los tests
npx vitest run

# Modo watch
npx vitest

# Coverage
npx vitest run --coverage
```

## Estructura del Proyecto

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Rutas de autenticación
│   │   ├── login/
│   │   │   └── page.tsx          # Login con Zod
│   │   └── register/
│   │       └── page.tsx          # Registro con Zod
│   └── dashboard/                # Dashboard (protegido)
│       ├── layout.tsx            # Layout con sidebar
│       ├── page.tsx              # Dashboard principal
│       ├── documents/
│       │   └── page.tsx          # Gestión documental
│       └── environmental/
│           ├── page.tsx          # Dashboard ambiental
│           ├── aspects/
│           │   ├── page.tsx      # Matriz de aspectos
│           │   └── [id]/
│           │       └── page.tsx  # Crear/editar aspecto
│           ├── pma/
│           │   └── page.tsx      # Planes de manejo
│           └── anla/
│               └── page.tsx      # Reportes ANLA
├── components/
│   ├── environmental/            # Componentes módulo ambiental
│   │   ├── AspectForm.tsx        # Formulario aspectos (fix: react-hook-form)
│   │   ├── AspectMatrix.tsx       # Tabla de aspectos
│   │   ├── PMACard.tsx            # Card de PMA
│   │   └── SignificanceBadge.tsx  # Badge de significancia
│   └── Providers.tsx              # React Query provider
├── lib/
│   ├── api.ts                    # Axios con interceptors
│   ├── api.test.ts               # Tests de api
│   ├── services.ts               # Servicios API
│   └── services.test.ts          # Tests de services
└── store/
    ├── authStore.ts              # Zustand auth store
    └── authStore.test.ts         # Tests del store
```

## Autenticación

El sistema utiliza JWT con refresh tokens:

1. **Login** → Recibe access token + refresh token
2. **Access Token** → Se envía en header `Authorization: Bearer <token>`
3. **Refresh Token** → Se usa automáticamente cuando el access token expira (interceptor de Axios)
4. **Logout** → Invalida el refresh token en el backend

Estado de autenticación se maneja con **Zustand** + persistencia en localStorage.

## Características

### Interceptores de Axios
- Agrega automáticamente el token de acceso a cada request
- Manejo automático de refresh token cuando expira (401)
- Redirección a login si el refresh falla
- Soporte multi-tenant con header `X-Tenant-ID`

### React Query
- Caché automático de 60 segundos
- Refetch al volver a enfocar la ventana
- Invalidación de caché después de mutaciones

### Forms
- React Hook Form + Zod validation
- Validación en tiempo real
- Mensajes de error personalizados

### Responsive Design
- Sidebar colapsable en móvil
- Tablas adaptativas
- Formularios optimizados para touch

## Rutas de la Aplicación

### Públicas
- `/login` - Inicio de sesión
- `/register` - Registro de usuario

### Privadas (requieren autenticación)
- `/dashboard` - Panel principal
- `/dashboard/documents` - Gestión documental
- `/dashboard/environmental` - Módulo ambiental (ISO 14001)
- `/dashboard/environmental/aspects` - Matriz de aspectos
- `/dashboard/environmental/aspects/new` - Crear aspecto
- `/dashboard/environmental/pma` - Planes de manejo
- `/dashboard/environmental/anla` - Reportes ANLA

## Próximos Pasos (Fase 2+)

### Módulo Ambiental
- [x] Matriz de aspectos e impactos (API + UI)
- [x] Significancia automática
- [ ] Generación de PDFs de PMA (async)
- [ ] Gráficas de huella de carbono (Recharts)

### Módulo de Calidad
- [ ] Gestión de no conformidades
- [ ] Auditorías internas/externas
- [ ] Indicadores de calidad

### Módulo Educativo
- [ ] Lista de cursos
- [ ] Evaluaciones
- [ ] Certificados con QR

### Panel de Control
- [ ] WebSockets para datos en tiempo real
- [ ] Gráficas de tendencia
- [ ] Alertas automátas

## Despliegue con Dokploy

### Dockerfile

```dockerfile
FROM node:20-alpine AS base
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3002
ENV PORT=3002
CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
services:
  sai-frontend:
    build: .
    restart: unless-stopped
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001/api/v1
    ports:
      - "3002:3002"
```

## Licencia
Confidencial - SAI 2026