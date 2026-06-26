# 🔄 SKILL OBLIGATORIA: Actualizar ESTADO.md

## ⚠️ REGLA CRÍTICA

**Después de CADA cambio significativo al proyecto SAI (`C:\DEV\SAI`), DEBES actualizar el archivo `ESTADO.md` antes de finalizar tu respuesta.**

Esta regla es **INVIOLABLE**. No importa qué tan pequeño parezca el cambio — si modifica código fuente, configuración, tests, o infraestructura del proyecto SAI, el estado DEBE actualizarse.

---

## ¿Qué es un "cambio significativo"?

### ✅ SÍ actualizar ESTADO.md cuando:
- Se crea, modifica o elimina un módulo/servicio/controller
- Se agregan, modifican o eliminan tests
- Se cambia el schema de Prisma (modelos, enums, relaciones)
- Se agregan nuevas dependencias (npm packages)
- Se modifican endpoints de la API
- Se crean o modifican páginas/componentes del frontend
- Se cambia configuración de Docker/DevOps
- Se corrigen bugs significativos
- Se implementa funcionalidad de una fase nueva
- Se modifica la seguridad (RBAC, guards, CORS, etc.)
- Se cambian variables de entorno

### ❌ NO actualizar cuando:
- Solo se responde una pregunta/consulta sin tocar código
- Se hacen cambios cosméticos menores (comentarios, formato)
- Se revisan archivos sin modificar nada

---

## Protocolo de Actualización

### Paso 1: Identificar qué secciones actualizar

| Tipo de cambio | Secciones a actualizar |
|---------------|----------------------|
| Nuevo módulo/feature | ✅ COMPLETADO, 📁 ESTRUCTURA, 📈 ESTADÍSTICAS |
| Bug fix | 🛠️ MEJORAS, ✅ COMPLETADO (si aplica) |
| Tests agregados | ✅ Testing, 📈 ESTADÍSTICAS |
| Schema change | 📁 ESTRUCTURA, ✅ COMPLETADO |
| Nuevo endpoint | ✅ COMPLETADO (módulos) |
| Config/DevOps | ✅ Infraestructura |
| Frontend page | ✅ Páginas, 📁 ESTRUCTURA |
| Fase completa | 📅 CRONOGRAMA, 🎯 PRÓXIMOS PASOS |

### Paso 2: Actualizar las siguientes fields SIEMPRE

```markdown
# En el header del documento:
> **Fecha de corte**: [FECHA ACTUAL en formato Mes DD, YYYY]
> **Versión**: [incrementar minor: 1.3 → 1.4]
> **Última actualización**: [Descripción concisa del cambio]

# Al final del documento:
**Última actualización**: [FECHA ACTUAL]
**Versión**: [misma versión que el header]
**Estado**: [Estado actual de la fase activa]
```

### Paso 3: Actualizar secciones afectadas

Cada sección tiene un formato específico. Aquí están los templates:

#### Para nuevas features completadas:
```markdown
#### ✅ [Nombre de la Feature] (NUEVO)
- [x] **Feature 1** - Descripción breve
- [x] **Feature 2** - Descripción breve
```

#### Para features en progreso:
```markdown
#### 🔄 [Nombre del Módulo] (EN PROGRESO)
- [x] Item completado
- [ ] Item pendiente
```

#### Para estadísticas de tests:
```markdown
| Métrica | Antes | Ahora |
|---------|-------|-------|
| **Tests** | [N anterior] | [N actual] |
| **Backend coverage** | [%] | [%] |
```

#### Para el cronograma:
```markdown
| Fase | Estado | Próxima acción |
|------|--------|----------------|
| **Fase N** | ✅/🔄/⏳ [%] | [Siguiente paso] |
```

### Paso 4: Actualizar PRÓXIMOS PASOS

Mover items de "pendiente" a "completado" y agregar nuevos próximos pasos si corresponde.

---

## Template de Cambio Rápido

Si el cambio es pequeño pero significativo, al mínimo actualiza:

1. **Header**: Fecha de corte + versión + descripción de última actualización
2. **La sección afectada**: Marcar checkboxes, agregar items
3. **Footer**: Fecha + versión

---

## Ejemplo de Actualización

Si se implementa el módulo de Calidad (quality):

```markdown
# Header
> **Fecha de corte**: Abril 19, 2026
> **Versión**: 1.4 - Módulo Calidad implementado
> **Última actualización**: CRUD de no conformidades y auditorías

# En ✅ LO QUE ESTÁ COMPLETADO, agregar:
#### ✅ Módulo Calidad (NUEVO)
- [x] **Non-Conformities** - CRUD completo con RBAC
- [x] **Audits** - CRUD completo con RBAC
- [x] **Tests** - 8 tests unitarios

# En ESTADÍSTICAS, actualizar contadores
# En CRONOGRAMA, cambiar Fase 4 de ⏳ a 🔄
# En ESTRUCTURA, agregar archivos nuevos

# Footer
**Última actualización**: Abril 19, 2026
**Versión**: 1.4
```

---

## Recordatorio Final

> 🚨 **ESTA SKILL ES OBLIGATORIA**. Si haces un cambio al proyecto SAI y no actualizas ESTADO.md, el estado del proyecto se desincroniza y el equipo pierde visibilidad del progreso. Siempre cierra tus cambios actualizando este archivo.
