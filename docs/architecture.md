# Architecture

## Overview

BullBrief is a Next.js 16 application using the App Router pattern with server-side rendering, API routes, and a PostgreSQL database.

## Directory Structure

```
bullbrief/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Auth pages (login, signup, forgot-password)
│   │   ├── (dashboard)/       # Authenticated pages (brief, watchlist, markets, etc.)
│   │   ├── (marketing)/       # Public pages
│   │   ├── api/               # API routes
│   │   ├── privacy/           # Legal pages
│   │   ├── terms/
│   │   └── disclaimer/
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── layout/            # Layout components (sidebar, top-nav, etc.)
│   │   ├── dashboard/         # Dashboard-specific components
│   │   ├── auth/              # Auth components
│   │   ├── onboarding/        # Onboarding components
│   │   └── settings/          # Settings components
│   ├── lib/
│   │   ├── providers/         # External API providers
│   │   │   ├── marketstack/   # Stock market data
│   │   │   ├── marketaux/     # News aggregation
│   │   │   └── podcast/       # Podcast API
│   │   ├── auth.ts            # Authentication (JWT)
│   │   ├── prisma.ts          # Prisma client
│   │   ├── cache.ts           # Server-side caching
│   │   ├── cn.ts              # Utility functions
│   │   ├── env.ts             # Environment validation
│   │   └── types.ts           # TypeScript types
│   ├── hooks/                 # Custom React hooks
│   └── proxy.ts               # Route protection (Next.js 16)
├── prisma/
│   └── schema.prisma          # Database schema
└── docs/                      # Documentation
```

## Key Patterns

### Server-Side Rendering
- Pages use React Server Components by default
- Client components are marked with `"use client"`
- API routes handle all external data fetching

### Authentication
- Custom JWT-based auth using `jose`
- Secure httpOnly cookies
- Route protection via `proxy.ts`

### Data Flow
1. Client → Internal API Route (e.g., `/api/markets/snapshot`)
2. API Route → Provider (e.g., Marketstack)
3. API Route → Cache layer
4. API Route → Response to client

### Caching
- Server-side caching via `ProviderCache` table
- Stale-while-revalidate pattern
- Provider-specific cache durations

### Error Handling
- `Promise.allSettled()` for parallel provider calls
- Graceful degradation when providers fail
- Cached data fallback
- User-friendly error messages (no raw API errors)

## Database Models

- **User** — Core user account
- **UserPreference** — Briefing schedule, interests, theme
- **Watchlist** / **WatchlistItem** — Stock watchlists
- **SavedArticle** / **SavedEpisode** — User saves
- **BriefingSnapshot** — Cached daily briefings
- **ProviderCache** — API response cache
