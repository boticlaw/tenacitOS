# Security Policy

## Supported Versions

Currently supporting:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by:

1. **Email**: security@openclaw.ai (or create a private security advisory on GitHub)
2. **Do NOT** open a public issue
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to resolve the issue.

## Security Best Practices

### For Deployment

1. **Strong Passwords**
   - Use at least 16 characters for `ADMIN_PASSWORD`
   - Generate with: `openssl rand -base64 24`

2. **Secrets**
   - Regenerate `AUTH_SECRET` for each instance
   - Generate with: `openssl rand -base64 32`
   - Never commit `.env.local` to git

3. **File Permissions**
   - Ensure `.env.local` is readable only by the app user:
     ```bash
     chmod 600 .env.local
     ```
   - Lock down credentials directory:
     ```bash
     chmod 700 ~/.openclaw/credentials
     ```

4. **Reverse Proxy**
   - Always use HTTPS in production (Caddy auto-handles this)
   - Configure rate limiting if exposing publicly
   - Whitelist trusted IPs for admin endpoints

5. **OpenClaw Gateway**
   - Keep gateway on loopback (127.0.0.1) if possible
   - Configure `trustedProxies` if behind a reverse proxy
   - Review security audit output: `openclaw status`

### For Development

1. **Never commit:**
   - `.env.local` (passwords, secrets)
   - `data/*.json` (operational data)
   - `data/*.db` (usage metrics)
   - Real usernames, emails, tokens

2. **Use branding config:**
   - Import from `src/config/branding.ts`
   - Use environment variables
   - Never hardcode personal info

3. **Dependencies:**
   - Run `npm audit` regularly
   - Update dependencies: `npm update`
   - Review Dependabot alerts

4. **Code Review:**
   - No `eval()` or `Function()` with user input
   - Validate and sanitize all input
   - Use parameterized queries (SQLite prepared statements)
   - Escape user-generated content in UI

## Known Security Considerations

### Authentication

- Basic password auth (no 2FA yet)
- Session tokens in cookies (httpOnly, secure in production)
- TODO: Add OAuth2 / SAML support

### Data Storage

- Local JSON files (not encrypted at rest)
- SQLite database (not encrypted)
- TODO: Add encryption for sensitive data

### Network

- Gateway API exposed on loopback by default
- Control UI exposed via reverse proxy
- TODO: Add mTLS for gateway communication

## Security Checklist

Before deploying to production:

- [ ] Changed `ADMIN_PASSWORD` from default
- [ ] Regenerated `AUTH_SECRET`
- [ ] Set file permissions on `.env.local` (600)
- [ ] Configured HTTPS via reverse proxy
- [ ] Reviewed `openclaw status` security audit
- [ ] Updated all npm dependencies
- [ ] Ran `npm audit fix`
- [ ] Configured firewall (UFW, iptables, etc.)
- [ ] Enabled fail2ban or similar (if public-facing)
- [ ] Configured backup for `data/` directory
- [ ] Documented incident response plan

## Responsible Disclosure

We follow coordinated vulnerability disclosure:

1. Reporter notifies us privately
2. We confirm and develop a fix
3. We release a patched version
4. Disclosure is made public after patch is available

Thank you for helping keep SuperBotijo secure! 🔒
