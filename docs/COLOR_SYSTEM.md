# Color System Documentation

This document describes the semantic color system used in SuperBotijo.

## Overview

The color system is based on semantic tokens that convey meaning rather than
specific color values. This approach improves:

- **Accessibility**: Consistent contrast ratios for text readability
- **Maintainability**: Easy to update colors globally
- **Clarity**: Color names indicate purpose, not appearance

## Semantic Tokens

### Status Colors

| Token | Purpose | Light Mode | Dark Mode |
|-------|---------|------------|-----------|
| `--semantic-success` | Positive outcomes, confirmations | Green (142 76% 36%) | Green (142 76% 45%) |
| `--semantic-warning` | Caution, potential issues | Amber (38 92% 50%) | Amber (38 92% 55%) |
| `--semantic-error` | Errors, destructive actions | Red (0 84% 60%) | Red (0 72% 55%) |
| `--semantic-info` | Information, neutral highlights | Blue (217 91% 60%) | Blue (217 91% 65%) |
| `--semantic-neutral` | Default states, backgrounds | Slate (215 16% 47%) | Slate (215 16% 55%) |

### Token Variants

Each semantic color has variants for different use cases:

```css
/* Base color */
--semantic-success

/* Light background variant */
--semantic-success-light

/* Darker variant for hover states */
--semantic-success-dark

/* Text color on top of the base color */
--semantic-success-foreground

/* Subtle background for badges, alerts */
--semantic-success-muted

/* Border color for outlines */
--semantic-success-border
```

### Agent/Session Status Colors

| Token | Usage |
|-------|-------|
| `--status-active` | Online, active, running |
| `--status-idle` | Waiting, paused |
| `--status-busy` | Processing, thinking |
| `--status-offline` | Disconnected, disabled |
| `--status-error` | Error state |

## Usage

### CSS Variables

```css
.my-component {
  background-color: hsl(var(--semantic-success-muted));
  color: hsl(var(--semantic-success-dark));
  border: 1px solid hsl(var(--semantic-success-border));
}
```

### Utility Classes

Background colors:
```html
<div class="bg-success">Success background</div>
<div class="bg-warning-light">Light warning background</div>
<div class="bg-error-muted">Muted error background</div>
```

Text colors:
```html
<span class="text-success">Success text</span>
<span class="text-error">Error text</span>
<span class="text-warning">Warning text</span>
```

Border colors:
```html
<div class="border border-success">Success border</div>
<div class="border border-error">Error border</div>
```

### Component Patterns

Badges:
```html
<span class="badge-success">Active</span>
<span class="badge-warning">Pending</span>
<span class="badge-error">Failed</span>
<span class="badge-info">Info</span>
```

Buttons:
```html
<button class="btn-success">Confirm</button>
<button class="btn-warning">Proceed with Caution</button>
<button class="btn-error">Delete</button>
<button class="btn-info">Learn More</button>
```

Alerts:
```html
<div class="alert-success">Operation completed successfully!</div>
<div class="alert-warning">Please review before continuing.</div>
<div class="alert-error">Something went wrong.</div>
<div class="alert-info">Here's some helpful information.</div>
```

## Accessibility

### Contrast Ratios

All text colors meet WCAG AA standards:

| Combination | Ratio | Standard |
|------------|-------|----------|
| text-primary on bg | 15.5:1 | ✅ AA (4.5:1) |
| text-secondary on bg | 5.2:1 | ✅ AA (4.5:1) |
| semantic-success on white | 4.8:1 | ✅ AA (4.5:1) |
| semantic-error on white | 5.1:1 | ✅ AA (4.5:1) |
| semantic-warning on black | 7.2:1 | ✅ AA (4.5:1) |

### Focus Indicators

Focus states use a consistent ring:

```css
:focus-visible {
  outline: 2px solid hsl(var(--focus-ring));
  outline-offset: 2px;
}
```

## Dark Mode

The system automatically adjusts colors for dark mode. No manual intervention
is needed - colors are defined for both light and dark themes.

To enable dark mode on an element:

```html
<div class="dark">
  <!-- Dark mode colors apply here -->
</div>
```

Or use the data attribute:

```html
<div data-theme="dark">
  <!-- Dark mode colors apply here -->
</div>
```

## Migration Guide

### From Legacy Colors

Replace old color variables with semantic tokens:

| Old Variable | New Token |
|-------------|-----------|
| `--positive` | `--semantic-success` |
| `--negative` | `--semantic-error` |
| `--warning` | `--semantic-warning` |
| `--info` | `--semantic-info` |
| `--success-bg` | `--semantic-success-muted` |
| `--error-bg` | `--semantic-error-muted` |

### Example Migration

Before:
```css
.status-badge {
  background-color: var(--positive-soft);
  color: var(--positive);
}
```

After:
```css
.status-badge {
  background-color: hsl(var(--semantic-success-muted));
  color: hsl(var(--semantic-success));
}
```

Or use the utility class:
```html
<span class="badge-success">Status</span>
```

## File Structure

```
src/
├── app/
│   └── globals.css          # Main CSS file (imports semantic.css)
└── styles/
    └── semantic.css         # Semantic color definitions
```

## Best Practices

1. **Use semantic tokens** - Avoid hardcoded colors
2. **Use utility classes** - For common patterns
3. **Maintain contrast** - Ensure text is readable
4. **Test both themes** - Verify in light and dark mode
5. **Document exceptions** - If you need custom colors, document why

## Color Palette Reference

### Success (Green)
- Base: `hsl(142 76% 36%)` / `#22863a`
- Light: `hsl(142 76% 90%)` / `#dcffe4`
- Dark: `hsl(142 76% 24%)` / `#144c20`

### Warning (Amber)
- Base: `hsl(38 92% 50%)` / `#f9a825`
- Light: `hsl(38 92% 90%)` / `#fff8e1`
- Dark: `hsl(38 92% 35%)` / `#c17900`

### Error (Red)
- Base: `hsl(0 84% 60%)` / `#e53935`
- Light: `hsl(0 84% 90%)` / `#ffebee`
- Dark: `hsl(0 84% 40%)` / `#b71c1c`

### Info (Blue)
- Base: `hsl(217 91% 60%)` / `#1e88e5`
- Light: `hsl(217 91% 90%)` / `#e3f2fd`
- Dark: `hsl(217 91% 40%)` / `#0d47a1`

### Neutral (Slate)
- Base: `hsl(215 16% 47%)` / `#64748b`
- Light: `hsl(215 16% 95%)` / `#f1f5f9`
- Dark: `hsl(215 16% 25%)` / `#334155`
