# Database Schema

## Overview

BullBrief uses PostgreSQL with Prisma ORM. The schema supports multi-tenant user data with row-level ownership.

## Models

### User
Core user account with authentication.

### UserPreference
User settings including timezone, briefing schedule, market/podcast interests, and theme.

### Watchlist / WatchlistItem
Stock watchlists with ordered items. Each user has one default watchlist.

### SavedArticle / SavedEpisode
User-saved content for later reading/listening.

### BriefingSnapshot
Cached daily briefing data generated from market data and news.

### ProviderCache
Server-side cache for external API responses with TTL.

## Row Ownership

Every user-scoped table includes a `userId` field. API routes verify ownership before read/write operations.

```typescript
// Example: Verify watchlist ownership
const watchlist = await prisma.watchlist.findUnique({ where: { id } });
if (!watchlist || watchlist.userId !== session.user.id) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
```

## Free Tier Limits

- 1 active watchlist
- 15 stocks per watchlist
- Paid tier limits can be added later

## Migration Commands

```bash
npx prisma migrate dev --name <name>
npx prisma migrate deploy
npx prisma migrate reset
npx prisma generate
```
