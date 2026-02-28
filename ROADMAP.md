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
- [x] **Knowledge Graph** - Grafo interactivo de conceptos (tab en /memory)
- [x] **Word Cloud** - Palabras frecuentes en memories (tab en /memory)
- **Archivos:** `src/app/(dashboard)/memory/page.tsx`, `src/components/FileTree.tsx`, `src/components/MarkdownEditor.tsx`, `src/components/KnowledgeGraph.tsx`, `src/components/MemoryWordCloud.tsx`

### 2.2 File Browser ✅
- [x] Explorador del workspace completo
- [x] Preview de archivos (código, markdown, JSON)
- [x] Descargar archivos
- [x] Upload de archivos
- [x] **3D View** - Vista 3D del árbol de archivos (toggle en /files)
- **Archivos:** `src/app/(dashboard)/files/page.tsx`, `src/components/FileBrowser.tsx`, `src/components/files-3d/FileTree3D.tsx`

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
- [x] **Sankey Diagrams** - Flow de tokens/tareas/tiempo (tab en /analytics)
- **Archivos:** `src/app/(dashboard)/analytics/page.tsx`, `src/components/sankey/SankeyDiagrams.tsx`

### 4.3 Performance Metrics ✅
- [x] Tiempo promedio de respuesta (en activity)
- [x] Tasa de éxito por tipo de tarea (SuccessRateGauge)
- [x] Uptime del agente
- **Archivos:** `src/app/api/system/uptime/route.ts`

---

## Fase 5: Comunicación ✅ COMPLETO
> Interacción bidireccional

### 5.1 Command Terminal ✅
- [x] Input para enviar mensajes/comandos a SuperBotijo
- [x] Output en tiempo real de respuesta
- [x] Historial de comandos
- [x] Shortcuts para comandos frecuentes
- **Archivos:** `src/app/(dashboard)/terminal/page.tsx`, `src/app/api/terminal/route.ts`

### 5.2 Notifications Log ✅
- [x] Lista de mensajes enviados por canal (Telegram, etc.)
- [x] Filtrar por fecha, canal, tipo
- [x] Preview del mensaje
- [x] Estado de entrega
- **Archivos:** `src/app/api/notifications/outbox/route.ts`, `src/app/(dashboard)/notifications/page.tsx`

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

## Fase 6: Configuración ✅ COMPLETO
> Admin del sistema

### 6.1 Skills Manager ✅
- [x] Lista de skills instalados
- [x] Ver SKILL.md de cada uno
- [x] Activar/desactivar
- [ ] Instalar desde ClawHub
- [ ] Actualizar skills
- **Archivos:** `src/app/(dashboard)/skills/page.tsx`, `src/app/api/skills/route.ts`, `src/app/api/skills/[id]/toggle/route.ts`

### 6.2 Integration Status ✅
- [x] Estado de conexiones (componente existe)
- [x] Última actividad por integración
- [x] Test de conectividad
- [x] Reautenticar si necesario
- **Archivos:** `src/components/IntegrationStatus.tsx`

### 6.3 Config Editor ✅
- [x] Ver configuración actual de OpenClaw
- [x] Editar valores seguros
- [x] Validación antes de guardar
- [x] Reiniciar gateway si necesario
- **Archivos:** `src/app/api/config/route.ts`, `src/components/ConfigEditor.tsx`

---

## Fase 7: Real-time ✅ COMPLETO
> WebSockets y notificaciones live

### 7.1 Live Activity Stream ✅
- [x] SSE connection (Server-Sent Events)
- [x] Updates en tiempo real del activity feed
- [x] Indicador "SuperBotijo está trabajando..." (LiveStatusIndicator)
- [x] Toast notifications (ToastProvider + useToast)
- **Archivos:** `src/app/api/activities/stream/route.ts`, `src/hooks/useActivityStream.ts`, `src/components/LiveStatusIndicator.tsx`, `src/components/Toast.tsx`

### 7.2 System Status ✅
- [x] Heartbeat del agente (en /heartbeat)
- [x] CPU/memoria del VPS (en `/system`)
- [x] Cola de tareas pendientes
- **Archivos:** `src/app/(dashboard)/system/page.tsx`

---

## Fase 8: The Office 3D 🏢 ✅ COMPLETO
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

### 8.2 Interactions & Ambient ✅
- [x] Avatares animados (tecleando, pensando, error)
- [x] Sub-agents aparecen como "visitantes" en la oficina
- [x] Trail visual entre parent y sub-agent
- [x] Efectos visuales (partículas success, humo error, beam heartbeat)
- [x] Sonido ambiental toggleable (teclas, notificaciones, lofi)
- [x] Click en objetos (archivador→Memory, pizarra→Roadmap, café→Mood)
- **Archivos:** `src/components/Office3D/AvatarAnimator.tsx`, `FileCabinet.tsx`, `Whiteboard.tsx`, `CoffeeMachine.tsx`, `WallClock.tsx`

### 8.3 Multi-Floor Building ✅
- [x] 4 plantas navegables con ascensor:
  - Planta 1: Main Office (agentes principales)
  - Planta 2: Server Room (DBs, VPS, integrations)
  - Planta 3: Archive (logs, memories históricas)
  - Azotea: Control Tower (dashboard gigante)
- [x] Customization: temas (modern, retro, cyberpunk, matrix)
- [x] Modos especiales (Focus, God Mode, Cinematic)
- **Archivos:** `src/components/Office3D/Building.tsx`, `src/components/Office3D/floors/*.tsx`

**Temas alternativos disponibles:**
- Habbo Room style (`src/components/office/HabboRoom.tsx`)
- Zelda Room style (`src/components/office/ZeldaRoom.tsx`)
- Stardew Valley style (`src/components/office/StardewRoom.tsx`)

**Datos en tiempo real:**
- `/api/agents/status` - estado de cada agente ✅
- `/api/activities` - activity feed ✅
- `/api/subagents` - sub-agentes activos ✅
- Polling cada 2-5 segundos

---

## Fase 9: Agent Intelligence ✅ COMPLETO
> Features experimentales y visualizaciones avanzadas (complementan "The Office")

### 9.1 Agent Mood Dashboard ✅
- [x] Widget de "estado de ánimo" basado en métricas recientes
- [x] Indicadores visuales: productivo, ocupado, idle, frustrado (muchos errores)
- [x] Streak counter: días consecutivos sin errores críticos
- [x] "Energy level" basado en tokens/hora
- [x] Emoji animado que cambia según el estado
- **Archivos:** `src/app/api/agents/mood/route.ts`, `src/components/MoodWidget.tsx`

### 9.2 Token Economics ✅
- [x] Vista detallada de consumo por modelo (en /analytics → Costs tab)
- [x] Breakdown: input tokens vs output tokens vs cache
- [x] Comparativa: "Hoy vs ayer", "Esta semana vs la pasada"
- [x] Proyección de gasto mensual
- [x] Top 5 tareas que más tokens consumen (TopTasksList)
- [x] Efficiency score (EfficiencyGauge)
- **Archivos:** `src/app/(dashboard)/analytics/page.tsx`, `src/components/TopTasksList.tsx`, `src/components/EfficiencyGauge.tsx`

### 9.3 Knowledge Graph Viewer ✅
- [x] Visualización de conceptos/entidades en MEMORY.md y brain
- [x] Grafo interactivo con nodes y links
- [x] Click en un nodo → muestra snippets relacionados
- [x] Clustering por temas
- [x] Búsqueda visual
- [x] Export a imagen
- **Archivos:** `src/components/KnowledgeGraph.tsx` (tab en /memory)

### 9.4 Model Playground ✅
- [x] Input un prompt
- [x] Seleccionar múltiples modelos para comparar
- [x] Ver respuestas lado a lado
- [x] Mostrar tokens/coste/tiempo de cada uno
- [x] Guardar experimentos
- [x] Share results (copy link)
- **Archivos:** `src/app/(dashboard)/playground/page.tsx`

### 9.5 Smart Suggestions Engine ✅
- [x] Analiza patrones de uso
- [x] Sugiere optimizaciones:
  - "Usas mucho Opus para tareas simples, prueba Sonnet"
  - "Muchos errores en cron X, revisar configuración"
  - "Heartbeats muy frecuentes, considera reducir intervalo"
  - "Token usage alto en horario Y, programar tareas pesadas en horario valle"
- [x] Tarjetas de sugerencia con botón "Apply" o "Dismiss"
- [x] Learn from dismissals
- **Archivos:** `src/lib/suggestions.ts`, `src/components/SuggestionsPanel.tsx`

---

## Fase 10: Sub-Agent Orchestra ✅ COMPLETO
> Gestión y visualización de multi-agent workflows

### 10.1 Sub-Agent Dashboard ✅
- [x] Lista de sub-agentes activos en tiempo real
- [x] Estado: running, waiting, completed, failed
- [x] Task description y progreso
- [x] Modelo usado
- [x] Tokens consumidos por cada uno
- [x] Timeline de spawns/completions
- **Archivos:** `src/app/(dashboard)/subagents/page.tsx`, `src/app/api/subagents/route.ts`

### 10.2 Agent Communication Graph ✅
- [x] Visualización de mensajes entre main agent y sub-agents
- [x] Flow diagram tipo network graph (React Flow)
- [x] Ver contenido de mensajes al hacer click
- [x] Filtrar por sesión, fecha, tipo
- **Archivos:** `src/components/CommunicationGraph.tsx` (tab en /agents)

### 10.3 Multi-Agent Orchestration ✅
- [x] Crear workflows visuales de múltiples agentes
- [x] Drag & drop tasks → auto-spawn agents
- [x] Dependencies entre tasks
- [x] Parallel vs sequential execution
- [x] Template workflows guardables
- **Archivos:** `src/app/(dashboard)/workflows/page.tsx`, `src/components/workflow/WorkflowCanvas.tsx`

---

## Fase 11: Advanced Visualizations ✅ COMPLETO
> Porque los dashboards cool tienen gráficas cool

### 11.1 3D Workspace Explorer ✅
- [x] Vista 3D del árbol de archivos
- [x] Tamaño de nodos = tamaño de archivo
- [x] Color = tipo de archivo
- [x] Navigate con mouse
- [x] Click → preview/edit
- [x] Wow factor 📈
- **Archivos:** `src/components/files-3d/FileTree3D.tsx` (toggle en /files)

### 11.2 Heatmaps Interactivos ✅
- [x] Actividad por hora del día (24x7 grid) - `HourlyHeatmap.tsx`
- [x] Hover → detalles de ese slot
- [x] Click → filtrar activity feed a ese rango
- [x] Export a imagen
- **Archivos:** `src/components/charts/HourlyHeatmap.tsx`

### 11.3 Sankey Diagrams ✅
- [x] Flow de tokens: input → cache → output
- [x] Flow de tareas: type → status
- [x] Flow de tiempo: hora → actividad → resultado
- **Archivos:** `src/components/sankey/SankeyDiagrams.tsx` (tab en /analytics)

### 11.4 Word Cloud de Memories ✅
- [x] Palabras más frecuentes en MEMORY.md
- [x] Tamaño = frecuencia
- [x] Click en palabra → buscar en memories
- [x] Animated on hover
- **Archivos:** `src/components/MemoryWordCloud.tsx` (tab en /memory)

---

## Fase 12: Collaboration ✅ COMPLETO
> Share y trabajo en equipo

### 12.1 Shareable Reports ✅
- [x] Generar report de actividad semanal/mensual
- [x] Export a imagen (PNG via html2canvas)
- [x] Share link público (read-only)
- [x] Custom date ranges
- **Archivos:** `src/app/(dashboard)/reports/page.tsx`, `src/app/(dashboard)/reports/[token]/page.tsx`

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
| Real-time | Server-Sent Events (SSE) |
| 3D Graphics | React Three Fiber + Drei + Rapier |
| Graphs/Networks | @xyflow/react (React Flow) |
| Animations | Framer Motion |
| Storage | JSON files (actual) → SQLite (usage tracking) |
| AI Integration | OpenClaw API + direct model calls para suggestions |
| PDF Generation | html2canvas (PNG export) |

---

## Resumen de Progreso

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
| 9. Agent Intelligence | ✅ | 100% |
| 10. Sub-Agent Orchestra | ✅ | 100% |
| 11. Advanced Viz | ✅ | 100% |
| 12. Collaboration | ⚠️ | 50% (Team Dashboard pendiente) |

**Overall: ~95% completado**

---

## Próximos Pasos (Future Work)

### Tier 1: Polish
1. **Skills Manager** - Instalar desde ClawHub, actualizar skills
2. **Team Dashboard** - Multi-user support

### Tier 2: Experimental
1. **AI Agents personalizables** - Configurar comportamiento de cada agente
2. **Plugins system** - Extensions de terceros

---

*Creado: 2026-02-07*
*Última actualización: 2026-02-28*
