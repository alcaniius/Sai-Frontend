# 🚀 Guía de Despliegue en Dokploy

Esta guía te muestra cómo desplegar el SAI (Sistema Ambiental Integrado) en tu instancia local de Dokploy.

---

## 📋 Requisitos Previos

1. ✅ **Dokploy instalado** y corriendo en `http://localhost:3000`
2. ✅ **Git instalado** en tu máquina
3. ✅ **Docker Desktop** instalado y corriendo

---

## 🎯 Arquitectura de Puertos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **Dokploy** | 3000 | Panel de control de Dokploy |
| **Backend API** | 3001 | API REST de NestJS |
| **Frontend** | 3002 | Aplicación Next.js |
| **MinIO API** | 9000 | Almacenamiento S3 |
| **MinIO Console** | 9001 | Panel de MinIO |

---

## 📦 Paso 1: Preparar el Repositorio

### 1.1 Inicializar Git

```bash
cd C:\DEV\SAI
git init
git add .
git commit -m "feat: Initial commit SAI Fase 1 - Ready for Dokploy"
```

### 1.2 Estructura Final del Proyecto

```
SAI/
├── .env.example               # Variables de entorno de ejemplo
├── .gitignore                 # Archivos ignorados
├── docker-compose.yml         # Configuración completa para Dokploy
├── README.md                  # Documentación principal
├── QUICKSTART.md              # Guía de inicio rápido
│
├── backend/                   # NestJS API
│   ├── Dockerfile             # Dockerfile de producción
│   ├── DOKPLOY.md            # Configuración específica
│   ├── docker-compose.yml     # Docker Compose individual (backup)
│   ├── prisma/
│   │   └── schema.prisma      # Esquema de base de datos
│   ├── src/                   # Código fuente
│   └── package.json
│
├── Frontend/                  # Next.js App
│   ├── Dockerfile             # Dockerfile de producción
│   ├── next.config.ts         # Configuración con output: standalone
│   ├── src/                   # Código fuente
│   └── package.json
│
└── app-movil/                 # Flutter (Fase 3)
```

---

## 🔧 Paso 2: Configurar Variables de Entorno

### 2.1 Crear archivo .env

```bash
cd C:\DEV\SAI
copy .env.example .env
```

### 2.2 Generar Secretos Seguros

Ejecuta estos comandos para generar secretos:

```bash
# JWT Secret
openssl rand -base64 32

# JWT Refresh Secret
openssl rand -base64 32

# Database Password
openssl rand -base64 24

# MinIO Secret Key
openssl rand -base64 32
```

### 2.3 Actualizar .env con Valores Seguros

Edita el archivo `.env` y reemplaza los valores `CHANGE_ME` con los secretos generados.

---

## 🌐 Paso 3: Desplegar en Dokploy

### Opción A: Usando Docker Compose (Recomendado)

#### 3.1 Abrir Dokploy

Navega a: `http://localhost:3000`

#### 3.2 Iniciar Sesión en Dokploy

Usa las credenciales que configuraste durante la instalación.

#### 3.3 Crear Nuevo Proyecto

1. Click en **"New Project"** o **"Create Project"**
2. Nombre: `SAI - Sistema Ambiental Integrado`
3. Descripción: `Plataforma SaaS para gestión ambiental`

#### 3.4 Conectar Repositorio

1. Selecciona **"Git Repository"**
2. Tipo: **Local** o **GitHub** (si subiste el repo)
3. Path: `C:\DEV\SAI`

#### 3.5 Seleccionar Docker Compose

1. Selecciona **"Docker Compose"**
2. Apunta al archivo: `docker-compose.yml`
3. Dokploy detectará automáticamente los servicios

#### 3.6 Configurar Variables de Entorno

En la sección de **Environment Variables** de Dokploy, agrega:

```env
POSTGRES_USER=sai_user
POSTGRES_PASSWORD=<tu_password_seguro>
JWT_SECRET=<tu_jwt_secret>
JWT_REFRESH_SECRET=<tu_refresh_secret>
MINIO_ACCESS_KEY=minio_admin
MINIO_SECRET_KEY=<tu_minio_secret>
FRONTEND_URL=http://localhost:3002
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

#### 3.7 Desplegar

1. Click en **"Deploy"** o **"Deploy Project"**
2. Dokploy construirá y desplegará todos los servicios automáticamente
3. Espera a que todos los servicios estén **healthy**

---

### Opción B: Despliegue Manual con Docker Compose

Si prefieres usar Docker Compose directamente:

```bash
cd C:\DEV\SAI

# Verificar que Docker está corriendo
docker ps

# Levantar todos los servicios
docker compose up -d

# Ver logs en tiempo real
docker compose logs -f

# Ver estado de servicios
docker compose ps

# Detener todos los servicios
docker compose down

# Detener y eliminar volúmenes (cuidado: borra datos)
docker compose down -v
```

---

## ✅ Paso 4: Verificar el Despliegue

### 4.1 Verificar Servicios

```bash
docker compose ps
```

Deberías ver:
- ✅ sai-postgres (healthy)
- ✅ sai-redis (healthy)
- ✅ sai-minio (healthy)
- ✅ sai-backend (healthy)
- ✅ sai-frontend

### 4.2 Acceder a los Servicios

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **Frontend** | http://localhost:3002 | N/A |
| **Backend API** | http://localhost:3001 | N/A |
| **MinIO Console** | http://localhost:9001 | minio_admin / <tu_secret> |
| **Health Check** | http://localhost:3001/api/v1/health | N/A |

### 4.3 Probar el Health Check

```bash
curl http://localhost:3001/api/v1/health
```

Debería responder:
```json
{
  "status": "ok",
  "timestamp": "2026-04-12T..."
}
```

---

## 🔍 Paso 5: Ejecutar Migraciones de Base de Datos

### 5.1 Acceder al Contenedor del Backend

```bash
docker exec -it sai-backend sh
```

### 5.2 Ejecutar Migraciones

```bash
# Dentro del contenedor
pnpm prisma migrate deploy
```

### 5.3 Verificar la Base de Datos

```bash
# Abrir Prisma Studio (opcional)
docker exec -it sai-backend pnpm prisma studio
```

---

## 🧪 Paso 6: Probar la Aplicación

### 6.1 Registrar un Usuario

Navega a: `http://localhost:3002/register`

Llena el formulario:
- Nombre: Tu nombre
- Apellido: Tu apellido
- Email: tu@email.com
- Contraseña: tu_password

### 6.2 Iniciar Sesión

Navega a: `http://localhost:3002/login`

Usa las credenciales que registraste.

### 6.3 Probar el Dashboard

Después de login, deberías ver:
- ✅ Sidebar con navegación
- ✅ Estadísticas de documentos
- ✅ Acciones rápidas
- ✅ Tu nombre en la esquina superior derecha

---

## 🔧 Solución de Problemas

### Problema: Puerto 3000 en Uso

**Solución**: Dokploy está usando el puerto 3000. El frontend ahora usa el 3002.

```bash
# Verificar qué usa el puerto 3000
netstat -ano | findstr :3000

# Si necesitas cambiar Dokploy de puerto, edita su configuración
```

### Problema: Backend No Conecta a PostgreSQL

**Causa**: Base de datos no está lista aún.

**Solución**:

```bash
# Verificar logs
docker logs sai-backend

# Reiniciar backend (postgres debería estar healthy)
docker compose restart backend

# Verificar health de postgres
docker inspect --format='{{.State.Health.Status}}' sai-postgres
```

### Problema: Error de Migraciones

**Solución**:

```bash
# Resetear migraciones (CUIDADO: borra datos)
docker exec -it sai-backend pnpm prisma migrate reset --force

# Aplicar migraciones nuevamente
docker exec -it sai-backend pnpm prisma migrate deploy
```

### Problema: Frontend No Conecta al Backend

**Verificar**:

1. Variables de entorno correctas:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
   ```

2. Backend está corriendo:
   ```bash
   curl http://localhost:3001/api/v1/health
   ```

3. CORS configurado correctamente en `/backend/src/main.ts`

### Problema: MinIO No Accesible

**Solución**:

```bash
# Verificar contenedor
docker logs sai-minio

# Reiniciar MinIO
docker compose restart minio

# Acceder a la consola
# http://localhost:9001
# Usuario: minio_admin
# Password: <tu_secret_key>
```

---

## 📊 Monitoreo y Logs

### Ver Logs en Tiempo Real

```bash
# Todos los servicios
docker compose logs -f

# Solo backend
docker compose logs -f backend

# Solo frontend
docker compose logs -f frontend

# Solo base de datos
docker compose logs -f postgres
```

### Ver Uso de Recursos

```bash
# Estadísticas de contenedores
docker stats

# Solo servicios SAI
docker stats sai-backend sai-frontend sai-postgres
```

### Acceder a la Base de Datos

```bash
# Conectar a PostgreSQL
docker exec -it sai-postgres psql -U sai_user -d sai_db

# Ver tablas
\dt

# Ver organizaciones
SELECT * FROM organizations;

# Ver usuarios
SELECT id, email, "firstName", "lastName", role FROM users;
```

---

## 🔄 Actualizaciones

### Actualizar la Aplicación

```bash
# 1. Hacer pull de cambios
cd C:\DEV\SAI
git pull

# 2. Reconstruir y redeplegar
docker compose up -d --build

# 3. Ejecutar nuevas migraciones
docker exec -it sai-backend pnpm prisma migrate deploy

# 4. Verificar
docker compose ps
```

### Rollback (Si Algo Sale Mal)

```bash
# Detener servicios actuales
docker compose down

# Levantar versión anterior (si tienes el tag)
docker compose up -d

# Restaurar backup de base de datos
docker exec -i sai-postgres psql -U sai_user -d sai_db < backup.sql
```

---

## 🎯 Próximos Pasos Después del Despliegue

1. ✅ **Crear primera organización** (vía API o Prisma Studio)
2. ✅ **Registrar usuarios de prueba**
3. ✅ **Subir documentos de prueba**
4. ✅ **Configurar MinIO bucket** para almacenamiento
5. ✅ **Probar flujo completo**: Login → Dashboard → Documentos

### Crear Organización de Prueba

```bash
# Acceder a PostgreSQL
docker exec -it sai-postgres psql -U sai_user -d sai_db

# Crear organización
INSERT INTO organizations (id, name, subdomain, schema, active, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Empresa Demo',
  'demo',
  'empresa_demo',
  true,
  NOW(),
  NOW()
);
```

---

## 📚 Recursos Adicionales

- **Documentación Dokploy**: https://dokploy.com/docs
- **Backend README**: `/backend/README.md`
- **Frontend README**: `/Frontend/README.md`
- **Guía Quickstart**: `/QUICKSTART.md`

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs: `docker compose logs -f`
2. Verifica que todos los servicios estén healthy
3. Comprueba las variables de entorno
4. Revisa `/QUICKSTART.md` para problemas comunes

---

**Guía creada**: Abril 2026  
**Versión**: 1.0  
**Dokploy**: Local Development
