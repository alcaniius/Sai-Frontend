# SAI Frontend - Patrones y Convenciones

## Stack
- **Next.js 16** con App Router
- **React 19**
- **Tailwind CSS 4** (via `@tailwindcss/postcss`)
- **Zustand 5** — estado global con persistencia
- **TanStack Query 5** — fetching y caché
- **React Hook Form 7** + **Zod 4** — formularios y validación
- **Axios** — HTTP client con interceptores
- **Lucide React** — iconos
- **Recharts 3** — gráficas
- **Vitest 4** + `@testing-library` — testing

## Estructura de Páginas

```
Frontend/src/app/
├── layout.tsx                    # Root layout
├── page.tsx                      # Redirect to /login
├── globals.css                   # Tailwind CSS
├── (auth)/                       # Grupo de rutas auth
│   ├── login/page.tsx
│   └── register/page.tsx
└── dashboard/
    ├── layout.tsx                # Layout con sidebar
    ├── page.tsx                  # Dashboard principal
    ├── documents/page.tsx        # Gestión documental
    └── environmental/
        ├── page.tsx              # Dashboard ambiental
        ├── aspects/page.tsx      # Matriz de aspectos
        ├── aspects/[id]/page.tsx # Crear/editar aspecto
        ├── pma/page.tsx          # Planes de manejo
        └── anla/page.tsx         # Reportes ANLA
```

## Componentes

```
Frontend/src/components/
├── Providers.tsx                 # TanStack Query Provider
├── environmental/
│   ├── AspectForm.tsx            # Form de aspectos (RHF + Zod)
│   ├── AspectMatrix.tsx          # Tabla de aspectos
│   ├── PMACard.tsx               # Card de PMA
│   └── SignificanceBadge.tsx     # Badge de significancia
└── ui/                           # Componentes reutilizables (VACÍO)
```

## API Client (src/lib/api.ts)

```typescript
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
});

// Request interceptor: agrega Bearer token + X-Tenant-ID
// Response interceptor: auto-refresh en 401, redirect a /login si falla
```

**Patrón**: El API client maneja automáticamente:
1. Agregar `Authorization: Bearer <token>` a cada request
2. Agregar `X-Tenant-ID` del usuario logueado
3. Auto-refresh del token en error 401
4. Redirect a `/login` si el refresh falla

## Servicios (src/lib/services.ts)

```typescript
// Patrón: Objeto con métodos async que llaman a api
export const authService = {
  login(data: LoginInput),    // POST /auth/login
  register(data: RegisterInput), // POST /auth/register
  logout(),                   // POST /auth/logout
};

export const documentsService = {
  getAll(), getById(id), create(data), update(id, data),
  delete(id), approve(id, action, comment),
};

export const environmentalService = {
  getAspects(), getAspectById(id), createAspect(data),
  updateAspect(id, data), deleteAspect(id),
  recalculateSignificance(id),
  getPMAs(), createPMA(data),
  getANLAReports(), createANLAReport(data),
};
```

> ⚠️ **Nota**: Los servicios de PDF async (generate-pdf, get pdf url, job status) NO están en el frontend aún.

## Auth Store (Zustand)

```typescript
interface AuthState {
  user: User | null;         // { id, email, firstName, lastName, role }
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;    // Para evitar flash de login

  setAuth(user, accessToken, refreshToken): void;
  logout(): void;
  updateUser(user): void;
}

// Persistencia: localStorage key = 'auth-storage'
// Rehydration: `onRehydrateStorage` → sets `isInitialized = true`
```

## Formularios - Patrón con Zod v4

```typescript
import { useForm } from 'react-hook-form';  // ✅ react-hook-form, NO react-form
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ⚠️ Zod v4: usar 'message', NO 'required_error'
const schema = z.object({
  impact: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], { message: 'Required' }), // ✅
  // z.enum([...], { required_error: '...' })  // ❌ NO funciona en Zod v4
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

## Env Vars Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Testing
```bash
cd Frontend && npx vitest run    # 12 tests
```

| Suite | Tests | Qué cubre |
|-------|-------|-----------|
| `authStore.test.ts` | 4 | setAuth, logout, updateUser |
| `api.test.ts` | 2 | configuración de axios |
| `services.test.ts` | 6 | auth, documents, environmental |

## Quirks Críticos
1. **Import**: `react-hook-form`, NUNCA `react-form`
2. **Zod v4**: `message` en lugar de `required_error` para enums
3. **Puerto**: Dev = 3002, Producción Dokploy = 3000
4. **Carpeta**: Frontend con F mayúscula (`Frontend/`)
5. **Providers.tsx**: Wrapper de TanStack Query, debe envolver la app
