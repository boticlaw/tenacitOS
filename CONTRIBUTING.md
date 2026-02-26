# Contributing to SuperBotijo

Thank you for your interest in contributing! 🫙

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/superbotijo.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Commit with clear messages
7. Push and create a Pull Request

## Development Setup

See [README.md](./README.md#quick-start) for setup instructions.

**TL;DR:**
```bash
npm install
cp .env.example .env.local
# Edit .env.local with your config
npm run dev
```

## Code Guidelines

### File Organization

- **Components**: `src/components/` - Reusable UI components
- **Pages**: `src/app/` - Next.js App Router pages
- **APIs**: `src/app/api/` - API route handlers
- **Config**: `src/config/` - Configuration files (branding, constants)
- **Lib**: `src/lib/` - Utilities, helpers, and libraries
- **Data**: `data/` - JSON data files (gitignored, use `.example` versions)

### Naming Conventions

- **Components**: PascalCase (`ActivityFeed.tsx`)
- **Utilities**: camelCase (`pricing.ts`, `usage-queries.ts`)
- **API Routes**: kebab-case folders (`/api/cron-jobs/`)
- **Config**: camelCase with SCREAMING_SNAKE for constants

### TypeScript

- Use TypeScript for all new code
- Define interfaces for data structures
- Avoid `any` - use `unknown` if type is truly unknown
- Export types alongside components

Example:
```typescript
export interface AgentStatus {
  agentId: string;
  status: 'idle' | 'working' | 'error';
  model?: string;
}

export function AgentCard({ agent }: { agent: AgentStatus }) {
  // ...
}
```

### React Components

- Use functional components with hooks
- Prefer `'use client'` for interactive components
- Keep components small and focused
- Extract logic into custom hooks when complex

Example:
```typescript
'use client';

import { useState, useEffect } from 'react';

export function MyComponent() {
  const [data, setData] = useState<DataType[]>([]);
  
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  
  return <div>{/* ... */}</div>;
}
```

### Styling

- Use Tailwind CSS v4 utility classes
- Use CSS variables for theming (see `globals.css`)
- Avoid inline styles except for dynamic values
- Use `className` over `style` when possible

Theme variables:
```css
--background: #000000;
--text-primary: #FFFFFF;
--accent: #FFCC00;
/* See src/app/globals.css for full list */
```

### API Routes

- Return `NextResponse.json()` for all API routes
- Use HTTP status codes correctly (200, 400, 404, 500)
- Handle errors gracefully with try/catch
- Validate input data

Example:
```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
```

## Privacy & Security

### 🚨 CRITICAL: No Personal Data in Commits

**NEVER commit:**
- `.env.local` (contains passwords, secrets)
- `data/*.json` (contains operational data)
- `data/*.db` (contains usage metrics)
- Personal usernames, emails, API keys, tokens
- Screenshot with real data (use mock data or blur)

**Use instead:**
- `.env.example` (with placeholder values)
- `data/*.example.json` (with example data)
- `BRANDING` config (via environment variables)

### Checking for Leaks

Before committing, run:

```bash
# Check for hardcoded personal data
grep -r "your-real-username" src/
grep -r "your-email@example.com" src/
grep -r "password\|secret\|token" .env.local

# Ensure .gitignore is working
git status
# Should NOT show .env.local or data/*.json
```

### Branding

Use the `BRANDING` config from `src/config/branding.ts` instead of hardcoding:

**❌ Bad:**
```typescript
const username = "@carlosazaustre";
```

**✅ Good:**
```typescript
import { BRANDING } from "@/config/branding";
const username = BRANDING.twitterHandle;
```

## Testing

### Manual Testing Checklist

Before submitting a PR:

- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `tsc --noEmit`
- [ ] No ESLint errors: `npm run lint`
- [ ] Tested in dev mode: `npm run dev`
- [ ] Tested in production mode: `npm run build && npm start`
- [ ] Responsive design works (mobile, tablet, desktop)
- [ ] Dark mode looks good (default theme)
- [ ] No console errors in browser
- [ ] No hardcoded personal data

### Feature Testing

For new features:

1. Test happy path (normal usage)
2. Test edge cases (empty data, large datasets, etc.)
3. Test error handling (network failures, invalid input)
4. Test on different screen sizes
5. Update `IMPLEMENTATION-STATUS.md`

## Commit Messages

Use clear, descriptive commit messages:

**Format:**
```
<type>: <short description>

<optional longer description>

<optional footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code formatting (no logic change)
- `refactor:` Code restructuring (no behavior change)
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

**Examples:**
```
feat: add real-time cost tracking with SQLite

Implemented usage collector that reads openclaw status,
calculates costs, and stores in SQLite database.

Closes #42
```

```
fix: prevent notification dropdown from closing on click inside

Added stopPropagation to prevent event bubbling when
clicking notification items.
```

## Pull Request Process

1. **Update documentation**
   - Update README.md if adding features
   - Update IMPLEMENTATION-STATUS.md with completion status
   - Add docstrings to new functions/components

2. **Keep PRs focused**
   - One feature/fix per PR
   - Don't mix refactoring with new features
   - Keep diffs small and reviewable

3. **PR Description Template**
   ```markdown
   ## What does this PR do?
   Brief description of changes.
   
   ## Type of change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Refactoring
   
   ## Testing
   - [ ] Tested locally in dev mode
   - [ ] Tested locally in production mode
   - [ ] No console errors
   - [ ] Responsive design verified
   
   ## Screenshots (if UI change)
   [Add screenshots here]
   
   ## Related Issues
   Closes #[issue number]
   ```

4. **Review Process**
   - Address reviewer feedback
   - Keep discussion respectful and constructive
   - Be patient - reviews may take a few days

## Documentation

When adding features:

1. **Code Comments**: Explain WHY, not WHAT
   ```typescript
   // ❌ Bad
   // Increment counter
   counter++;
   
   // ✅ Good
   // Reset counter after 100 to prevent overflow
   if (counter >= 100) counter = 0;
   ```

2. **JSDoc for Functions**
   ```typescript
   /**
    * Calculate cost based on token usage and model pricing
    * @param modelId - Model identifier (e.g., "anthropic/claude-opus-4-6")
    * @param inputTokens - Number of input tokens used
    * @param outputTokens - Number of output tokens generated
    * @returns Total cost in USD
    */
   export function calculateCost(
     modelId: string,
     inputTokens: number,
     outputTokens: number
   ): number {
     // ...
   }
   ```

3. **README Updates**: Add to README.md if:
   - New API endpoint
   - New configuration option
   - New dependency
   - Breaking change

## Reporting Bugs

Use GitHub Issues with this template:

```markdown
**Describe the bug**
Clear description of what's wrong.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen instead.

**Screenshots**
If applicable.

**Environment**
- OS: [e.g., Ubuntu 22.04]
- Node version: [e.g., 22.0.0]
- OpenClaw version: [e.g., 2026.2.19]
- Browser: [e.g., Chrome 120]

**Additional context**
Any other relevant info.
```

## Feature Requests

Feature requests are welcome! Use GitHub Issues with:

- **Use case**: Why is this needed?
- **Proposed solution**: How should it work?
- **Alternatives**: Other ways to solve the problem?
- **Priority**: Nice-to-have vs critical

Check [ROADMAP.md](./ROADMAP.md) first - it might already be planned!

## Questions?

- **Discord**: [OpenClaw Community](https://discord.com/invite/clawd)
- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bug reports and feature requests

---

Thank you for contributing! 🫙✨
