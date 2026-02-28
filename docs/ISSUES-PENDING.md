# Issues para SuperBotijo - Completar Funcionalidades

## Issue #1: Integrar Smart Suggestions en Dashboard

### Prioridad
🔴 Alta

### Estimación
1-2 horas

### Descripción
El componente `SuggestionsPanel` está completamente implementado pero **no se usa en ninguna página**. Debe integrarse en el Dashboard para que los usuarios vean sugerencias de optimización.

### Estado Actual
- ✅ `src/lib/suggestions-engine.ts` - Motor de análisis
- ✅ `src/components/SuggestionsPanel.tsx` - UI con props `compact` y `maxItems`
- ✅ `src/app/api/suggestions/route.ts` - API endpoint
- ❌ **NO importado en ninguna página**

### Tareas

#### 1. Importar SuggestionsPanel en Dashboard
**Archivo:** `src/app/(dashboard)/page.tsx`

Añadir import al inicio del archivo:
```tsx
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
```

#### 2. Añadir componente en la sección Quick Links
**Archivo:** `src/app/(dashboard)/page.tsx`

Después del `MoodWidget` (línea ~318), añadir:
```tsx
{/* Smart Suggestions */}
<div style={{ margin: "1rem", marginTop: "0.5rem" }}>
  <div
    className="p-4 rounded-lg"
    style={{ backgroundColor: 'var(--card-elevated)', border: '1px solid var(--border)' }}
  >
    <h3
      className="text-sm font-semibold mb-3"
      style={{ color: 'var(--text-secondary)' }}
    >
      💡 Smart Suggestions
    </h3>
    <SuggestionsPanel compact maxItems={3} />
  </div>
</div>
```

#### 3. Verificar funcionamiento
1. Ir al Dashboard
2. Confirmar que aparece sección "Smart Suggestions"
3. Verificar que los botones "Apply" y "Dismiss" funcionan

### Criterios de Aceptación
- [ ] Dashboard muestra sección "Smart Suggestions"
- [ ] Se muestran máximo 3 sugerencias
- [ ] Botón "Dismiss" oculta la sugerencia
- [ ] Botón "Apply" ejecuta la acción (si aplica)
- [ ] No hay errores en consola

---

## Issue #2: Reports - Añadir UI para Generate/Export/Share

### Prioridad
🔴 Alta

### Estimación
3-4 horas

### Descripción
La página `/reports` tiene las APIs implementadas pero faltan botones en la UI para:
1. Generar nuevos reports
2. Exportar a PNG
3. Compartir via link público

### Estado Actual
- ✅ `POST /api/reports/generated` - Generar report (acepta `{name, type, period}`)
- ✅ `POST /api/reports/[id]/share` - Compartir (devuelve `{token, shareUrl}`)
- ✅ `GET /api/reports/[id]/pdf` - Exportar HTML/PNG
- ❌ **Sin botones en la UI**

### Tareas

#### 1. Añadir estado y handlers
**Archivo:** `src/app/(dashboard)/reports/page.tsx`

Añadir después de los estados existentes:
```tsx
const [isGenerating, setIsGenerating] = useState(false);
const [sharingId, setSharingId] = useState<string | null>(null);

const handleGenerate = async (type: "weekly" | "monthly") => {
  setIsGenerating(true);
  try {
    const now = new Date();
    const name = `${type}-report-${now.toISOString().split('T')[0]}`;
    const res = await fetch("/api/reports/generated", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, period: type }),
    });
    if (res.ok) {
      loadReports(); // Refresh list
    }
  } finally {
    setIsGenerating(false);
  }
};

const handleExport = async (reportPath: string) => {
  const id = reportPath.split('/').pop()?.replace('.md', '');
  window.open(`/api/reports/${id}/pdf`, '_blank');
};

const handleShare = async (reportPath: string) => {
  const id = reportPath.split('/').pop()?.replace('.md', '');
  setSharingId(id);
  try {
    const res = await fetch(`/api/reports/${id}/share`, { method: 'POST' });
    const data = await res.json();
    await navigator.clipboard.writeText(data.shareUrl);
    alert('Link copied to clipboard!');
  } finally {
    setSharingId(null);
  }
};
```

#### 2. Añadir botón "Generate Report" en el header
**Archivo:** `src/app/(dashboard)/reports/page.tsx`

En el header, después del título, añadir:
```tsx
<div className="flex gap-2">
  <button
    onClick={() => handleGenerate('weekly')}
    disabled={isGenerating}
    className="px-3 py-1.5 rounded-lg text-sm"
    style={{
      backgroundColor: 'var(--accent)',
      color: 'white',
      opacity: isGenerating ? 0.5 : 1,
    }}
  >
    {isGenerating ? 'Generating...' : '+ Weekly Report'}
  </button>
  <button
    onClick={() => handleGenerate('monthly')}
    disabled={isGenerating}
    className="px-3 py-1.5 rounded-lg text-sm"
    style={{
      backgroundColor: 'var(--card-elevated)',
      border: '1px solid var(--border)',
      color: 'var(--text-primary)',
    }}
  >
    + Monthly Report
  </button>
</div>
```

#### 3. Añadir botones Export/Share en cada report card
En el listado de reports, añadir botones:
```tsx
<button onClick={() => handleExport(report.path)} title="Export">
  <Download className="w-4 h-4" />
</button>
<button 
  onClick={() => handleShare(report.path)} 
  disabled={sharingId === report.id}
  title="Share"
>
  <Share2 className="w-4 h-4" />
</button>
```

#### 4. Añadir imports necesarios
```tsx
import { Download, Share2 } from "lucide-react";
```

### Criterios de Aceptación
- [ ] Botón "+ Weekly Report" genera un nuevo report
- [ ] Botón "+ Monthly Report" genera un report mensual
- [ ] Botón "Export" abre/descarga el report
- [ ] Botón "Share" copia link público al clipboard
- [ ] Alert confirma que el link fue copiado
- [ ] Estados de loading mientras genera/comparte

---

## Issue #3: Añadir Calendar y Notifications al Sidebar

### Prioridad
🟡 Media

### Estimación
30 minutos

### Descripción
Las páginas `/calendar` y `/notifications` existen y funcionan, pero **no están en el Sidebar**, por lo que son inaccesibles desde la navegación.

### Estado Actual
- ✅ `/calendar` - Página funcional con vista semanal
- ✅ `/notifications` - Página funcional con lista de notificaciones
- ❌ **No aparecen en Sidebar**

### Tareas

#### 1. Añadir Calendar al grupo "Data"
**Archivo:** `src/components/Sidebar.tsx`

En `navGroups`, grupo "Data", añadir:
```tsx
{
  title: "Data",
  items: [
    { href: "/memory", label: "Memory", icon: Brain },
    { href: "/files", label: "Files", icon: FolderOpen },
    { href: "/sessions", label: "Sessions", icon: Timer },
    { href: "/activity", label: "Activity", icon: Activity },
    { href: "/calendar", label: "Calendar", icon: Calendar }, // ← AÑADIR
    { href: "/notifications", label: "Notifications", icon: Bell }, // ← AÑADIR
  ],
},
```

#### 2. Añadir imports necesarios
**Archivo:** `src/components/Sidebar.tsx`

```tsx
import {
  // ... existing imports
  Calendar,
  Bell,
} from "lucide-react";
```

### Criterios de Aceptación
- [ ] Calendar aparece en grupo "Data" del Sidebar
- [ ] Notifications aparece en grupo "Data" del Sidebar
- [ ] Click navega a la página correcta
- [ ] Iconos visibles y correctos

---

## Issue #4: Actualizar ROADMAP.md con estado real

### Prioridad
🟢 Baja

### Estimación
30 minutos

### Descripción
El ROADMAP tiene información desactualizada sobre el estado de varias features.

### Cambios Necesarios

#### 1. Skills Manager - Marcar como 100% completo
**Sección 6.1** - Cambiar:
```markdown
- [ ] Instalar desde ClawHub
- [ ] Actualizar skills
```
A:
```markdown
- [x] Instalar desde ClawHub
- [x] Actualizar skills
```

#### 2. Reports - Marcar UI como pendiente
**Sección 12.1** - Cambiar:
```markdown
- [x] Generar report de actividad semanal/mensual
- [x] Export a imagen (PNG via html2canvas)
- [x] Share link público (read-only)
- [x] Custom date ranges
```
A:
```markdown
- [x] Generar report de actividad semanal/mensual (API listo)
- [ ] Export a imagen (API listo, falta UI)
- [ ] Share link público (API listo, falta UI)
- [ ] Custom date ranges (pendiente)
```

#### 3. Añadir Git Dashboard
**Nueva sección en Fase 6:**
```markdown
### 6.4 Git Dashboard ✅
- [x] Lista de repositorios en workspace
- [x] Ver branch, ahead/behind, último commit
- [x] Ver archivos staged, unstaged, untracked
- [x] Acciones: status, log, diff, pull
- **Archivos:** `src/app/(dashboard)/git/page.tsx`
```

#### 4. Añadir Calendar
**Nueva sección en Fase 6:**
```markdown
### 6.5 Calendar ✅
- [x] Vista semanal de calendario
- [x] Mostrar tareas programadas
- [x] Navegación entre semanas
- **Archivos:** `src/app/(dashboard)/calendar/page.tsx`
```

#### 5. Añadir Notifications Page
**Nueva sección en Fase 5:**
```markdown
### 5.5 Notifications Page ✅
- [x] Lista completa de notificaciones
- [x] Filtros por tipo y fecha
- [x] Marcar como leída
- [x] Eliminar notificaciones
- **Archivos:** `src/app/(dashboard)/notifications/page.tsx`
```

#### 6. Smart Suggestions - Nota de integración pendiente
**Sección 9.5** - Cambiar estado a ⚠️:
```markdown
### 9.5 Smart Suggestions Engine ⚠️
- [x] Analiza patrones de uso
- [x] Sugiere optimizaciones
- [x] Tarjetas de sugerencia con botón "Apply" o "Dismiss"
- [x] Learn from dismissals
- [ ] **Integración en Dashboard** (componente existe, falta añadir)
```

#### 7. Actualizar tabla de progreso
```markdown
| Fase | Estado | Progreso |
|------|--------|----------|
| 1. Fundamentos | ✅ | 100% |
| 2. Memory & Files | ✅ | 100% |
| 3. Unified Cron Dashboard | ✅ | 100% |
| 4. Analytics | ✅ | 100% |
| 5. Comunicación | ✅ | 100% |
| 6. Configuración | ✅ | 100% |
| 7. Real-time | ✅ | 100% |
| 8. The Office 3D | ✅ | 100% |
| 9. Agent Intelligence | ⚠️ | 90% (falta integrar Suggestions) |
| 10. Sub-Agent Orchestra | ✅ | 100% |
| 11. Advanced Viz | ✅ | 100% |
| 12. Collaboration | ⚠️ | 75% (Reports UI incompleto) |

**Overall: ~97% completado**
```

### Criterios de Aceptación
- [ ] Skills marcado como 100% completo
- [ ] Reports muestra accurately qué falta
- [ ] Git Dashboard documentado
- [ ] Calendar documentado
- [ ] Notifications documentado
- [ ] Smart Suggestions marca integración como pendiente
- [ ] Tabla de progreso actualizada

---

## Resumen de Issues

| # | Issue | Prioridad | Estimación | Dependencias |
|---|-------|-----------|------------|--------------|
| 1 | Integrar Smart Suggestions | 🔴 Alta | 1-2h | Ninguna |
| 2 | Reports UI (Generate/Export/Share) | 🔴 Alta | 3-4h | Ninguna |
| 3 | Añadir Calendar/Notifications al Sidebar | 🟡 Media | 30min | Ninguna |
| 4 | Actualizar ROADMAP | 🟢 Baja | 30min | Issues 1-3 |

**Total estimado:** 5-7 horas

---

## Orden Recomendado de Implementación

1. **Issue #3** (30min) - Añadir páginas ocultas al Sidebar (quick win)
2. **Issue #1** (1-2h) - Integrar Smart Suggestions (ya implementado, solo importar)
3. **Issue #2** (3-4h) - Reports UI (más trabajo pero importante)
4. **Issue #4** (30min) - Actualizar ROADMAP (reflejar cambios)
