"use client";

import { BRANDING } from "@/config/branding";

interface Workflow {
  id: string;
  emoji: string;
  name: string;
  description: string;
  schedule: string;
  steps: string[];
  status: "active" | "inactive";
  trigger: "cron" | "demand";
}

const WORKFLOWS: Workflow[] = [
  {
    id: "social-radar",
    emoji: "🔭",
    name: "Social Radar",
    description: "Monitoriza menciones, oportunidades de colaboración y conversaciones relevantes en redes sociales y foros.",
    schedule: "9:30h y 17:30h (cada día)",
    trigger: "cron",
    status: "active",
    steps: [
      `Busca menciones de ${BRANDING.twitterHandle} en Twitter/X, LinkedIn e Instagram`,
      "Revisa hilos de Reddit en r/webdev, r/javascript, r/learnprogramming",
      `Detecta oportunidades de colaboración y collabs entrantes (${BRANDING.ownerCollabEmail})`,
      "Monitoriza aprendiendo.dev en conversaciones y menciones",
      "Envía resumen por Telegram si hay algo relevante",
    ],
  },
  {
    id: "noticias-ia",
    emoji: "📰",
    name: "Noticias IA y Web",
    description: "Resume las noticias más relevantes de IA y desarrollo web del timeline de Twitter para arrancar el día informado.",
    schedule: "7:45h (cada día)",
    trigger: "cron",
    status: "active",
    steps: [
      "Lee el timeline de Twitter/X via bird CLI",
      "Filtra noticias de IA, web dev, arquitectura y herramientas dev",
      `Selecciona 5-7 noticias más relevantes para el nicho de ${BRANDING.ownerUsername}`,
      "Genera resumen estructurado con enlace y contexto",
      "Envía digest por Telegram",
    ],
  },
  {
    id: "trend-monitor",
    emoji: "🔥",
    name: "Trend Monitor",
    description: "Radar de tendencias urgentes en el nicho tech. Detecta temas virales antes de que exploten para aprovechar la ola de contenido.",
    schedule: "7h, 10h, 15h y 20h (cada día)",
    trigger: "cron",
    status: "active",
    steps: [
      "Monitoriza trending topics en Twitter/X relacionados con tech y programación",
      "Busca en Hacker News, dev.to y GitHub Trending",
      `Evalúa si el trend es relevante para el canal de ${BRANDING.ownerUsername}`,
      "Si detecta algo urgente, notifica inmediatamente con contexto",
      "Sugiere ángulo de contenido si el trend tiene potencial",
    ],
  },
  {
    id: "daily-linkedin",
    emoji: "📊",
    name: "Daily LinkedIn Brief",
    description: "Genera el post de LinkedIn del día basado en las noticias más relevantes de Hacker News, dev.to y la web tech.",
    schedule: "9h (cada día)",
    trigger: "cron",
    status: "active",
    steps: [
      "Recopila top posts de Hacker News (front page tech/dev)",
      "Revisa trending en dev.to y artículos destacados",
      `Selecciona tema con mayor potencial de engagement para la audiencia de ${BRANDING.ownerUsername}`,
      `Redacta post de LinkedIn en la voz de ${BRANDING.ownerUsername} (profesional-cercano, sin emojis ni hashtags)`,
      "Envía borrador por Telegram para revisión y publicación",
    ],
  },
  {
    id: "newsletter-digest",
    emoji: "📬",
    name: "Newsletter Digest",
    description: `Digest curado de las newsletters del día. Consolida lo mejor de las suscripciones de ${BRANDING.ownerUsername} en un resumen accionable.`,
    schedule: "20h (cada día)",
    trigger: "cron",
    status: "active",
    steps: [
      "Accede a Gmail y busca newsletters recibidas en el día",
      "Filtra por remitentes relevantes (tech, IA, productividad, inversiones)",
      "Extrae los puntos clave de cada newsletter",
      "Genera digest estructurado por categorías",
      "Envía resumen por Telegram",
    ],
  },
  {
    id: "email-categorization",
    emoji: "📧",
    name: "Email Categorization",
    description: `Categoriza y resume los emails del día para que ${BRANDING.ownerUsername} empiece la jornada sin inbox anxiety.`,
    schedule: "7:45h (cada día)",
    trigger: "cron",
    status: "active",
    steps: [
      "Accede a Gmail y lee emails no leídos del día",
      "Categoriza: urgente / colabs / facturas / universidad / newsletters / otros",
      "Resumen de cada categoría con acción recomendada",
      "Detecta emails de clientes con facturas pendientes (>90 días)",
      "Envía resumen estructurado por Telegram",
    ],
  },
  {
    id: "weekly-newsletter",
    emoji: "📅",
    name: "Weekly Newsletter",
    description: "Recapitulación semanal automática de los tweets y posts de LinkedIn para usar como base de la newsletter.",
    schedule: "Domingos 18h",
    trigger: "cron",
    status: "active",
    steps: [
      `Recopila tweets de la semana (${BRANDING.twitterHandle} via bird CLI)`,
      "Recopila posts publicados en LinkedIn",
      "Organiza por temas y relevancia",
      "Genera borrador de recapitulación semanal en tono newsletter",
      "Envía por Telegram para revisión antes de publicar",
    ],
  },
  {
    id: "advisory-board",
    emoji: "🏛️",
    name: "Advisory Board",
    description: "7 asesores IA con personalidades y memorias propias. Consulta a cualquier advisor o convoca al board completo.",
    schedule: "Bajo demanda",
    trigger: "demand",
    status: "active",
    steps: [
      `${BRANDING.ownerUsername} envía /cfo, /cmo, /cto, /legal, /growth, /coach o /producto`,
      "SuperBotijo carga el skill advisory-board/SKILL.md",
      "Lee el archivo de memoria del advisor correspondiente (memory/advisors/)",
      `Responde en la voz y personalidad del advisor con contexto de ${BRANDING.ownerUsername}`,
      "Actualiza el archivo de memoria con lo aprendido en la consulta",
      "/board convoca los 7 advisors en secuencia y compila un board meeting completo",
    ],
  },
  {
    id: "git-backup",
    emoji: "🔄",
    name: "Git Backup",
    description: "Auto-commit y push del workspace cada 4 horas para garantizar que nada se pierde.",
    schedule: "Cada 4h",
    trigger: "cron",
    status: "active",
    steps: [
      "Comprueba si hay cambios en el workspace de SuperBotijo",
      "Si hay cambios: git add -A",
      "Genera mensaje de commit automático con timestamp y resumen de cambios",
      "git push al repositorio remoto",
      "Silencioso si no hay cambios — solo notifica si hay error",
    ],
  },
  {
    id: "nightly-evolution",
    emoji: "🌙",
    name: "Nightly Evolution",
    description: "Sesión autónoma nocturna que implementa mejoras en SuperBotijo según el ROADMAP o inventa features nuevas útiles.",
    schedule: "3h (cada noche)",
    trigger: "cron",
    status: "active",
    steps: [
      "Lee ROADMAP.md de SuperBotijo para seleccionar la siguiente feature",
      "Si no hay features claras, analiza el estado actual e inventa algo útil",
      "Implementa la feature completa (código, tests si aplica, UI)",
      "Verifica que el build de Next.js no falla",
      `Notifica a ${BRANDING.ownerUsername} por Telegram con el resumen de lo implementado`,
    ],
  },
];

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <div style={{
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        backgroundColor: status === "active" ? "var(--positive)" : "var(--text-muted)",
      }} />
      <span style={{
        fontFamily: "var(--font-body)",
        fontSize: "10px",
        fontWeight: 600,
        color: status === "active" ? "var(--positive)" : "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}>
        {status === "active" ? "Activo" : "Inactivo"}
      </span>
    </div>
  );
}

function TriggerBadge({ trigger }: { trigger: "cron" | "demand" }) {
  return (
    <div style={{
      padding: "2px 7px",
      backgroundColor: trigger === "cron"
        ? "rgba(59, 130, 246, 0.12)"
        : "rgba(168, 85, 247, 0.12)",
      border: `1px solid ${trigger === "cron" ? "rgba(59, 130, 246, 0.25)" : "rgba(168, 85, 247, 0.25)"}`,
      borderRadius: "5px",
      fontFamily: "var(--font-body)",
      fontSize: "10px",
      fontWeight: 600,
      color: trigger === "cron" ? "#60a5fa" : "var(--accent)",
      letterSpacing: "0.4px",
      textTransform: "uppercase" as const,
    }}>
      {trigger === "cron" ? "⏱ Cron" : "⚡ Demanda"}
    </div>
  );
}

export default function WorkflowsPage() {
  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "24px",
          fontWeight: 700,
          letterSpacing: "-1px",
          color: "var(--text-primary)",
          marginBottom: "4px",
        }}>
          Workflows
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)" }}>
          {WORKFLOWS.filter(w => w.status === "active").length} flujos activos · {WORKFLOWS.filter(w => w.trigger === "cron").length} crons automáticos · {WORKFLOWS.filter(w => w.trigger === "demand").length} bajo demanda
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
        {[
          { label: "Total workflows", value: WORKFLOWS.length, color: "var(--text-primary)" },
          { label: "Crons activos", value: WORKFLOWS.filter(w => w.trigger === "cron" && w.status === "active").length, color: "#60a5fa" },
          { label: "Bajo demanda", value: WORKFLOWS.filter(w => w.trigger === "demand").length, color: "var(--accent)" },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: "16px 20px",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            minWidth: "140px",
          }}>
            <div style={{
              fontFamily: "var(--font-heading)",
              fontSize: "28px",
              fontWeight: 700,
              color: stat.color,
              letterSpacing: "-1px",
            }}>
              {stat.value}
            </div>
            <div style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--text-muted)",
              marginTop: "2px",
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Workflow cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {WORKFLOWS.map((workflow) => (
          <div key={workflow.id} style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "20px 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}>
            {/* Card header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "var(--surface-elevated)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  border: "1px solid var(--border-strong)",
                  flexShrink: 0,
                }}>
                  {workflow.emoji}
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.3px",
                    marginBottom: "2px",
                  }}>
                    {workflow.name}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <TriggerBadge trigger={workflow.trigger} />
                    <StatusBadge status={workflow.status} />
                  </div>
                </div>
              </div>
              {/* Schedule */}
              <div style={{
                padding: "6px 12px",
                backgroundColor: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                color: "var(--text-secondary)",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}>
                🕐 {workflow.schedule}
              </div>
            </div>

            {/* Description */}
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--text-secondary)",
              lineHeight: "1.6",
              marginBottom: "16px",
            }}>
              {workflow.description}
            </p>

            {/* Steps */}
            <div style={{
              backgroundColor: "var(--surface-elevated)",
              borderRadius: "10px",
              padding: "12px 16px",
              border: "1px solid var(--border)",
            }}>
              <div style={{
                fontFamily: "var(--font-body)",
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.7px",
                marginBottom: "8px",
              }}>
                Pasos
              </div>
              <ol style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {workflow.steps.map((step, i) => (
                  <li key={i} style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    lineHeight: "1.5",
                  }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
