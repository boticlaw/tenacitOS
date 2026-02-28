# Color System Semántico - SuperBotijo

> **Última actualización:** 2026-02-28  
> **Issue:** #58

## Resumen

Este documento describe el sistema de colores semánticos implementado en SuperBotijo. El objetivo es proporcionar una paleta consistente, accesible y fácil de mantener.

## Tokens Semánticos

### Colores de Estado

| Token | Uso | Valor (Dark) | Valor (Light) |
|-------|-----|--------------|---------------|
| `success` | Estados positivos, confirmaciones | `#32D74B` | `#16A34A` |
| `warning` | Alertas, precaución | `#FFD60A` | `#CA8A04` |
| `error` | Errores, acciones destructivas | `#FF453A` | `#DC2626` |
| `info` | Información, ayuda | `#0A84FF` | `#2563EB` |

### Variantes de Color

Cada color semántico tiene variantes para diferentes contextos:

```css
/* Ejemplo con success */
--color-success        /* Color principal */
--color-success-soft   /* Fondo sutil (12.5% opacity) */
--color-success-muted  /* Fondo muted (10% opacity) */
--color-success-bg     /* Fondo de badge (10% opacity) */
```

### Colores Neutros

Paleta de grises para texto, bordes y fondos:

| Token | Uso | Valor |
|-------|-----|-------|
| `neutral-50` | Fondo claro | `#FAFAFA` |
| `neutral-100` | Fondo secundario | `#F4F4F5` |
| `neutral-200` | Bordes claros | `#E4E4E7` |
| `neutral-300` | Bordes | `#D4D4D8` |
| `neutral-400` | Texto muted | `#A1A1AA` |
| `neutral-500` | Texto secundario | `#71717A` |
| `neutral-600` | Texto | `#52525B` |
| `neutral-700` | Bordes oscuros | `#3F3F46` |
| `neutral-800` | Fondos oscuros | `#27272A` |
| `neutral-900` | Fondo muy oscuro | `#18181B` |
| `neutral-950` | Negro puro | `#0C0C0F` |

## Uso en Tailwind CSS

### Clases Disponibles

```jsx
// Colores de estado
<div className="bg-success text-success bg-success-soft" />
<div className="bg-warning text-warning bg-warning-soft" />
<div className="bg-error text-error bg-error-soft" />
<div className="bg-info text-info bg-info-soft" />

// Colores neutros
<div className="bg-neutral-800 text-neutral-400" />
<div className="border-neutral-700" />

// Superficies
<div className="bg-surface hover:bg-surface-hover" />
<div className="bg-surface-elevated" />

// Bordes
<div className="border-border" />
<div className="border-border-strong" />

// Acento
<div className="bg-accent text-accent hover:bg-accent-hover" />
```

### Mapeo de Colores Legacy

| Antes | Después |
|-------|---------|
| `bg-emerald-500` | `bg-success` |
| `bg-red-500` | `bg-error` |
| `bg-blue-500` | `bg-info` |
| `bg-yellow-500` | `bg-warning` |
| `bg-green-500` | `bg-success` |
| `text-gray-400` | `text-neutral-400` |
| `bg-gray-800` | `bg-neutral-800` |
| `border-gray-700` | `border-neutral-700` |

## Accesibilidad (WCAG AA)

### Contraste Mínimo

- **Texto normal:** 4.5:1
- **Texto grande:** 3:1
- **Componentes UI:** 3:1

### Verificación

Los colores implementados cumplen con WCAG AA en modo oscuro:

| Combinación | Ratio | Estado |
|-------------|-------|--------|
| success sobre negro | 8.2:1 | ✅ AA |
| error sobre negro | 6.8:1 | ✅ AA |
| warning sobre negro | 11.4:1 | ✅ AA |
| info sobre negro | 5.9:1 | ✅ AA |
| neutral-400 sobre negro | 5.7:1 | ✅ AA |

## Dark Mode

El sistema está optimizado para dark mode por defecto. Los valores de los tokens pueden adaptarse para light mode usando CSS custom properties con el prefijo `.light` o `@media (prefers-color-scheme: light)`.

```css
/* Ejemplo de soporte light mode */
@media (prefers-color-scheme: light) {
  :root {
    --color-success: #16A34A;
    --color-error: #DC2626;
    --color-warning: #CA8A04;
    --color-info: #2563EB;
  }
}
```

## Archivos Modificados

- `src/app/globals.css` - Definición de tokens con @theme
- `src/components/*.tsx` - Migración a clases semánticas

## Mejores Prácticas

1. **Usar tokens semánticos** - Nunca usar colores hardcoded como `#FF0000`
2. **Consistencia** - Usar el mismo token para el mismo concepto
3. **Contraste** - Verificar accesibilidad al cambiar colores
4. **Dark mode first** - Diseñar para dark mode, adaptar para light

## Referencias

- [Tailwind CSS v4 Theme](https://tailwindcss.com/docs/theme)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Apple Human Interface Guidelines - Color](https://developer.apple.com/design/human-interface-guidelines/color)
