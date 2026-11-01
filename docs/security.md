> Status note — 31 October 2026: this is a legacy design summary, not a deployed-control audit or compliance certification. Do not use its blanket claims as vendor-review evidence. See [the current review package](vendor-review/README.md) for implemented controls, unverified configuration and release gates.

# Security

## Authentication

- JWT-based authentication using `jose`
- Tokens stored in httpOnly, secure cookies
- 7-day token expiry
- No secrets exposed to the client

## API Security

- All external API calls are server-side only
- Environment variables validated at startup
- No secrets in logs or client responses
- Rate limiting via API providers

## Data Protection

- Row-level ownership checks on all user data
- Users cannot read/modify other users' data
- Input validation with Zod on all API routes
- SQL injection prevented by Prisma ORM

## Content Security

- Article/podcast descriptions sanitized
- External links open in new tabs with `noopener noreferrer`
- No `eval()` or `innerHTML` usage

## Environment Variables

- `.env` excluded from git via `.gitignore`
- `.env.example` committed with placeholder values
- Production secrets set via hosting platform

## Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Dependencies

- Regular security audits via `npm audit`
- Minimal dependency count
- No unnecessary packages
