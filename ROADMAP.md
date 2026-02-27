# 🫙 SuperBotijo - Roadmap

## Fase 1: Fundamentos ✅ COMPLETO
> Mejorar lo que ya existe y añadir datos reales

### 1.1 Activity Logger Real ✅
- [x] Crear endpoint POST `/api/activities` para que SuperBotijo registre acciones
- [x] Hook en OpenClaw para loguear automáticamente cada tool call
- [x] Campos: timestamp, type, description, status, duration, tokens_used
- [x] Retención: últimos 30 días
- **Archivos:** `src/app/api/activities/route.ts`, `src/app/(dashboard)/activity/page.tsx`

### 1.2 Integración con Cron Real ✅
- [x] Leer cron jobs reales de OpenClaw (`cron list`)
- [x] Mostrar en calendario con próximas ejecuciones
- [x] Historial de ejecuciones pasadas

### 1.3 Stats Dashboard ✅
- [x] Contador de actividades por día/semana
- [x] Tipos de acciones más frecuentes
- [x] Tasa de éxito/error
- **Archivos:** `src/components/charts/*`, `src/components/ActivityHeatmap.tsx`

---

## Fase 2: Memory & Files ✅ COMPLETO
> Gestión visual del workspace

### 2.1 Memory Browser ✅
- [x] Vista árbol de `memory/*.md` y archivos principales
- [x] Editor markdown con preview
- [x] Crear/renombrar/eliminar archivos
- [x] Búsqueda dentro de archivos
- **Archivos:** `src/app/(dashboard)/memory/page.tsx`, `src/components/FileTree.tsx`, `src/components/MarkdownEditor.tsx`

### 2.2 File Browser ✅
- [x] Explorador del workspace completo
- [x] Preview de archivos (código, markdown, JSON)
- [x] Descargar archivos
- [x] Upload de archivos
- **Archivos:** `src/app/(dashboard)/files/page.tsx`, `src/components/FileBrowser.tsx`, `src/app/api/files/*`

### 2.3 MEMORY.md Viewer ✅
- [x] Vista especial para MEMORY.md con secciones colapsables
- [x] Edición inline
- [x] Historial de cambios (git log) - integrado en Memory Browser
- **Archivos:** Integrado en Memory Browser

---

## Fase 3: Unified Cron Dashboard ✅ COMPLETO
> Control total de tareas programadas - System + OpenClaw + Heartbeat

> **Ver documentación:** `docs/CRON-SYSTEMS.md`

### 3.1 System Cron Viewer ✅
- [x] API: Leer jobs de `/etc/cron.d/`
- [x] API: Run Now + View Logs
- [x] UI: SystemCronCard con badge diferenciado
- [x] UI: Modal de logs
- **Archivos:** `src/app/api/cron/system/route.ts`, `src/app/api/cron/system-run/route.ts`, `src/app/api/cron/system-logs/route.ts`, `src/components/SystemCronCard.tsx`

### 3.2 OpenClaw Cron Manager ✅
- [x] Listar todos los jobs con estado
- [x] Crear nuevo job con form visual (CronJobModal conectado al API)
- [x] Editar job existente
- [x] Eliminar job (con confirmación)
- [x] Activar/desactivar job
- [x] Visual builder con 6 modos de frecuencia
- [x] Preview de próximas 5 ejecuciones
- [x] Templates predefinidos
- **Archivos:** `src/app/api/cron/route.ts`, `src/components/CronJobModal.tsx`

### 3.3 Heartbeat Monitor ✅
- [x] API: Estado de heartbeat (enabled, interval, target)
- [x] API: Leer/escribir HEARTBEAT.md
- [x] UI: Panel de estado
- [x] UI: Editor de HEARTBEAT.md con template
- **Archivos:** `src/app/api/heartbeat/route.ts`, `src/components/HeartbeatStatus.tsx`

### 3.4 Unified Views ✅
- [x] Tabs: All / System / OpenClaw / Heartbeat
- [x] Weekly Timeline View (OpenClaw jobs)
- [x] Stats cards unificados (4 cards: System, OpenClaw, Heartbeat, Paused)
- [x] Click en stats filtra por tipo
- **Archivos:** `src/app/(dashboard)/cron/page.tsx`, `src/components/CronWeeklyTimeline.tsx`

### 3.5 Historial de Ejecuciones ✅
- [x] **"Run Now" button** en CronJobCard y SystemCronCard
- [x] **Run History inline** con filtros
- [x] Log con output completo
- **Archivos:** `src/app/api/cron/run/route.ts`, `src/app/api/cron/runs/route.ts`

---

## Fase 4: Analytics ✅ COMPLETO
> Visualización de datos

### 4.1 Gráficas de Uso ✅
- [x] Actividad por hora del día (heatmap)
- [x] Tokens consumidos por día (line chart)
- [x] Tipos de tareas (pie chart)
- [x] Tendencia semanal
- **Archivos:** `src/app/(dashboard)/analytics/page.tsx`, `src/components/charts/*`

### 4.2 Cost Tracking ✅
- [x] Estimación de coste por modelo
- [x] Coste acumulado diario/mensual
- [x] Alertas de gasto (opcional)
- **Archivos:** `src/app/(dashboard)/costs/page.tsx`, `src/app/api/costs/route.ts`

### 4.3 Performance Metrics ⚠️
- [x] Tiempo promedio de respuesta (en activity)
- [x] Tasa de éxito por tipo de tarea (SuccessRateGauge)
- [ ] Uptime del agente

---

## Fase 5: Comunicación ⚠️ PARCIAL
> Interacción bidireccional

### 5.1 Command Terminal ✅
- [x] Input para enviar mensajes/comandos a SuperBotijo
- [x] Output en tiempo real de respuesta
- [x] Historial de comandos
- [x] Shortcuts para comandos frecuentes
- **Archivos:** `src/app/(dashboard)/terminal/page.tsx`, `src/app/api/terminal/route.ts`

### 5.2 Notifications Log ❌
- [ ] Lista de mensajes enviados por canal (Telegram, etc.)
- [ ] Filtrar por fecha, canal, tipo
- [ ] Preview del mensaje
- [ ] Estado de entrega

### 5.3 Session History ✅
- [x] **Lista de sesiones** → todas las sesiones de OpenClaw (main, cron, subagent, chats)
- [x] **Tipos visuales** → badges con emoji 🫙 Main / 🕐 Cron / 🤖 Sub-agent / 💬 Direct
- [x] **Token counter** → total tokens + barra de contexto (% usado) con color-coding
- [x] **Model badge** → modelo mostrado (Sonnet 4.5, Opus 4.6, etc.)
- [x] **Age display** → "2 hours ago", "3 days ago" con date-fns
- [x] **Transcript viewer** → slide-in panel con mensajes del JSONL real
- [x] **Bubbles UI** → user/assistant/tool_use/tool_result con diferentes estilos
- [x] **Filter tabs** → All / Main / Cron / Sub-agents / Chats con contador
- [x] **Búsqueda** → filtro por key/model
- [x] **Stats cards** → Total sessions, Total tokens, Cron runs, Models used
- **Archivos:** `src/app/api/sessions/route.ts`, `src/app/(dashboard)/sessions/page.tsx`

### 5.4 Notifications System ✅
- [x] **API de notificaciones** → `GET/POST/PATCH/DELETE /api/notifications`
- [x] **NotificationDropdown component** → Bell icon en TopBar con dropdown funcional
- [x] **Unread count badge** → Contador de notificaciones no leídas
- [x] **Notificación types** → info, success, warning, error con iconos y colores
- [x] **Mark as read/unread** → Individual o todas
- [x] **Delete notifications** → Individual o clear all read
- [x] **Links** → Notificaciones pueden tener links a páginas internas
- [x] **Auto-refresh** → Poll cada 30 segundos
- [x] **Integración con cron** → Cron Run Now genera notificación
- **Archivos:** `src/app/api/notifications/route.ts`, `src/components/NotificationDropdown.tsx`

---

## Fase 6: Configuración ⚠️ PARCIAL
> Admin del sistema

### 6.1 Skills Manager ✅
- [x] Lista de skills instalados
- [x] Ver SKILL.md de cada uno
- [ ] Activar/desactivar
- [ ] Instalar desde ClawHub
- [ ] Actualizar skills
- **Archivos:** `src/app/(dashboard)/skills/page.tsx`, `src/app/api/skills/route.ts`

### 6.2 Integration Status ⚠️
- [x] Estado de conexiones (componente existe)
- [ ] Última actividad por integración
- [ ] Test de conectividad
- [ ] Reautenticar si necesario
- **Archivos:** `src/components/IntegrationStatus.tsx`

### 6.3 Config Editor ❌
- [ ] Ver configuración actual de OpenClaw
- [ ] Editar valores seguros
- [ ] Validación antes de guardar
- [ ] Reiniciar gateway si necesario

---

## Fase 7: Real-time ❌ PENDIENTE
> WebSockets y notificaciones live

### 7.1 Live Activity Stream
- [ ] WebSocket connection
- [ ] Updates en tiempo real del activity feed
- [ ] Indicador "SuperBotijo está trabajando..."
- [ ] Toast notifications

### 7.2 System Status
- [ ] Heartbeat del agente
- [ ] CPU/memoria del VPS (parcial en `/system`)
- [ ] Cola de tareas pendientes

---

## Fase 8: The Office 3D 🏢 ⚠️ PARCIAL
> Entorno 3D navegable que simula una oficina virtual donde trabajan los agentes

**Ver spec completa:** `ROADMAP-OFFICE-3D.md`

### 8.1 MVP - Oficina Básica ✅
- [x] Sala 3D con React Three Fiber + escritorios dinámicos
- [x] Navegación WASD + mouse (fly mode) - FirstPersonControls
- [x] Monitors mostrando estado: Working/Idle/Error
- [x] Click en escritorio → panel lateral con activity feed
- [x] Iluminación básica (día/noche)
- [x] Avatares con emoji del agente
- **Archivos:** `src/components/Office3D/Office3D.tsx`, `src/app/office/page.tsx`

### 8.2 Interactions & Ambient ⚠️
- [ ] Avatares animados (tecleando, pensando, error)
- [ ] Sub-agents aparecen como "visitantes" en la oficina
- [ ] Trail visual entre parent y sub-agent
- [ ] Efectos visuales (partículas success, humo error, beam heartbeat)
- [ ] Sonido ambiental toggleable (teclas, notificaciones, lofi)
- [x] Click en objetos (archivador→Memory, pizarra→Roadmap, café→Mood)
- **Archivos:** `src/components/Office3D/FileCabinet.tsx`, `Whiteboard.tsx`, `CoffeeMachine.tsx`, `WallClock.tsx`

### 8.3 Multi-Floor Building ❌
- [ ] 4 plantas navegables con ascensor:
  - Planta 1: Main Office (agentes principales)
  - Planta 2: Server Room (DBs, VPS, integrations)
  - Planta 3: Archive (logs, memories históricas)
  - Azotea: Control Tower (dashboard gigante)
- [ ] Customization: temas (modern, retro, cyberpunk, matrix)
- [ ] Modos especiales (Focus, God Mode, Cinematic)

**Temas alternativos disponibles:**
- Habbo Room style (`src/components/office/HabboRoom.tsx`)
- Zelda Room style (`src/components/office/ZeldaRoom.tsx`)
- Stardew Valley style (`src/components/office/StardewRoom.tsx`)

**Datos en tiempo real:**
- `/api/agents/status` - estado de cada agente ✅
- `/api/activities` - activity feed ✅
- `/api/subagents` - sub-agentes activos ❌
- Polling cada 2-5 segundos

---

## Fase 9: Agent Intelligence ❌ PENDIENTE
> Features experimentales y visualizaciones avanzadas (complementan "The Office")

### 9.1 Agent Mood Dashboard
- [ ] Widget de "estado de ánimo" basado en métricas recientes
- [ ] Indicadores visuales: productivo, ocupado, idle, frustrado (muchos errores)
- [ ] Streak counter: días consecutivos sin errores críticos
- [ ] "Energy level" basado en tokens/hora
- [ ] Emoji animado que cambia según el estado

### 9.2 Token Economics ⚠️ (parcial en /costs)
- [x] Vista detallada de consumo por modelo (en /costs)
- [x] Breakdown: input tokens vs output tokens vs cache
- [x] Comparativa: "Hoy vs ayer", "Esta semana vs la pasada"
- [x] Proyección de gasto mensual
- [ ] Top 5 tareas que más tokens consumen
- [ ] Efficiency score: output útil / tokens totales

### 9.3 Knowledge Graph Viewer
- [ ] Visualización de conceptos/entidades en MEMORY.md y brain
- [ ] Grafo interactivo con nodes y links
- [ ] Click en un nodo → muestra snippets relacionados
- [ ] Clustering por temas
- [ ] Búsqueda visual
- [ ] Export a imagen

### 9.4 Quick Actions Hub ✅
- [x] Panel de botones para acciones frecuentes:
  - Backup workspace now
  - Clear temp files
  - Test all integrations
  - Re-authorize expired tokens
  - Git status all repos
  - Restart Gateway
  - Flush message queue
- [x] Status de cada acción (last run, next scheduled)
- [x] One-click execution con confirmación
- **Archivos:** `src/app/(dashboard)/actions/page.tsx`, `src/app/api/actions/route.ts`

### 9.5 Model Playground
- [ ] Input un prompt
- [ ] Seleccionar múltiples modelos para comparar
- [ ] Ver respuestas lado a lado
- [ ] Mostrar tokens/coste/tiempo de cada uno
- [ ] Guardar experimentos
- [ ] Share results (copy link)

### 9.6 Smart Suggestions Engine
- [ ] Analiza patrones de uso
- [ ] Sugiere optimizaciones:
  - "Usas mucho Opus para tareas simples, prueba Sonnet"
  - "Muchos errores en cron X, revisar configuración"
  - "Heartbeats muy frecuentes, considera reducir intervalo"
  - "Token usage alto en horario Y, programar tareas pesadas en horario valle"
- [ ] Tarjetas de sugerencia con botón "Apply" o "Dismiss"
- [ ] Learn from dismissals

---

## Fase 10: Sub-Agent Orchestra ❌ PENDIENTE
> Gestión y visualización de multi-agent workflows

### 10.1 Sub-Agent Dashboard
- [ ] Lista de sub-agentes activos en tiempo real
- [ ] Estado: running, waiting, completed, failed
- [ ] Task description y progreso
- [ ] Modelo usado
- [ ] Tokens consumidos por cada uno
- [ ] Timeline de spawns/completions

### 10.2 Agent Communication Graph
- [ ] Visualización de mensajes entre main agent y sub-agents
- [ ] Flow diagram tipo Sankey o network graph
- [ ] Ver contenido de mensajes al hacer click
- [ ] Filtrar por sesión, fecha, tipo

### 10.3 Multi-Agent Orchestration
- [ ] Crear workflows visuales de múltiples agentes
- [ ] Drag & drop tasks → auto-spawn agents
- [ ] Dependencies entre tasks
- [ ] Parallel vs sequential execution
- [ ] Template workflows guardables

---

## Fase 11: Advanced Visualizations ❌ PENDIENTE
> Porque los dashboards cool tienen gráficas cool

### 11.1 3D Workspace Explorer
- [ ] Vista 3D del árbol de archivos
- [ ] Tamaño de nodos = tamaño de archivo
- [ ] Color = tipo de archivo
- [ ] Navigate con mouse
- [ ] Click → preview/edit
- [ ] Wow factor 📈

### 11.2 Heatmaps Interactivos ⚠️ (básico existe)
- [x] Actividad por hora del día (24x7 grid) - `HourlyHeatmap.tsx`
- [ ] Hover → detalles de ese slot
- [ ] Click → filtrar activity feed a ese rango
- [ ] Export a imagen

### 11.3 Sankey Diagrams
- [ ] Flow de tokens: input → cache → output
- [ ] Flow de tareas: type → status
- [ ] Flow de tiempo: hora → actividad → resultado

### 11.4 Word Cloud de Memories
- [ ] Palabras más frecuentes en MEMORY.md
- [ ] Tamaño = frecuencia
- [ ] Click en palabra → buscar en memories
- [ ] Animated on hover

---

## Fase 12: Collaboration ❌ PENDIENTE
> Share y trabajo en equipo

### 12.1 Shareable Reports
- [ ] Generar report de actividad semanal/mensual
- [ ] Export a PDF
- [ ] Share link público (read-only)
- [ ] Custom date ranges

### 12.2 Team Dashboard (futuro)
- [ ] Multi-user support
- [ ] Ver actividad de otros agentes
- [ ] Compare performance
- [ ] Shared memory bank

---

## Stack Técnico

| Componente | Tecnología |
|------------|------------|
| Frontend | Next.js 16 + App Router + React 19 |
| Styling | Tailwind v4 (latest) |
| Charts | Recharts (básicos) + D3.js (avanzados) |
| Editor | Monaco Editor (code) + TipTap (markdown) |
| Real-time | Server-Sent Events (SSE) o Socket.io |
| 3D Graphics | React Three Fiber + Drei + Rapier |
| Graphs/Networks | Cytoscape.js o Vis.js |
| Animations | Framer Motion |
| Storage | JSON files (actual) → SQLite (usage tracking) |
| AI Integration | OpenClaw API + direct model calls para suggestions |
| PDF Generation | jsPDF o Puppeteer |

---

## Prioridad Recomendada (Actualizada 2026-02-27)

### ✅ Completado
- **Fase 1** - Activity Logger Real
- **Fase 2** - Memory & Files
- **Fase 3** - Unified Cron Dashboard (System + OpenClaw + Heartbeat)
- **Fase 4** - Analytics
- **Fase 5.1, 5.3, 5.4** - Terminal, Sessions, Notifications
- **Fase 8.1** - Office 3D MVP
- **Fase 9.4** - Quick Actions Hub

### 🔥 Próximos pasos (Quick Wins)
1. **Fase 5.2** - Notifications Log (historial de mensajes enviados)
2. **Fase 8.2** - Avatares animados en Office 3D
3. **Fase 6.3** - Config Editor

### Tier 1: Core Functionality (Must Have)
1. **Fase 6.3** - Config Editor

### Tier 2: High Value (Should Have)
3. **Fase 7** - Real-time updates → UX premium
4. **Fase 10.1** - Sub-Agent Dashboard → visibilidad de workflows
5. **Fase 9.1** - Agent Mood Dashboard → visual engagement

### Tier 3: Intelligence & Insights (Nice to Have)
6. **Fase 9.2** - Token Economics → optimización de costes
7. **Fase 9.6** - Smart Suggestions → IA que se auto-mejora

### Tier 4: Advanced Features (Wow Factor)
8. **Fase 8.3** - Multi-Floor Building
9. **Fase 9.3** - Knowledge Graph → visualización avanzada
10. **Fase 11.2** - Heatmaps Interactivos → análisis visual

### Tier 5: Polish & Experimental (Future)
11. **Fase 11.1** - 3D Workspace Explorer
12. **Fase 12** - Collaboration → equipo/público

---

## Resumen de Progreso

| Fase | Estado | Progreso |
|------|--------|----------|
| 1. Fundamentos | ✅ | 100% |
| 2. Memory & Files | ✅ | 100% |
| 3. Unified Cron Dashboard | ✅ | 100% |
| 4. Analytics | ✅ | 95% |
| 5. Comunicación | ⚠️ | 75% |
| 6. Configuración | ⚠️ | 40% |
| 7. Real-time | ❌ | 0% |
| 8. The Office 3D | ⚠️ | 60% |
| 9. Agent Intelligence | ⚠️ | 20% |
| 10. Sub-Agent Orchestra | ❌ | 0% |
| 11. Advanced Viz | ❌ | 5% |
| 12. Collaboration | ❌ | 0% |

**Overall: ~50% completado**

---

*Creado: 2026-02-07*
*Última actualización: 2026-02-27*
