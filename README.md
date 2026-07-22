# BullBrief

**Market updates. Stay ahead.**

A personalized daily market briefing app that gives you a snapshot of major market indexes, current data for watched stocks, personalized financial headlines, relevant podcast episodes, and a concise daily summary.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL + Prisma 7
- **Auth:** Custom JWT (jose)
- **Validation:** Zod
- **Charts:** Recharts
- **Icons:** Lucide React

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Secret for JWT signing |
| `NEXT_PUBLIC_APP_URL` | App URL (http://localhost:3000) |
| `MARKETSTACK_API_KEY` | Marketstack API key |
| `MARKETAUX_API_TOKEN` | Marketaux API token |
| `CRON_SECRET` | Secret for cron endpoints |

### 3. Database setup

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Migration Commands

```bash
# Create a migration
npx prisma migrate dev --name <migration-name>

# Apply migrations in production
npx prisma migrate deploy

# Reset the database
npx prisma migrate reset

# Regenerate Prisma Client
npx prisma generate
```

## Running Tests

```bash
# Unit tests
npm test

# E2E tests
npx playwright test
```

## Production Build

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Docker

```bash
docker build -t bullbrief .
docker run -p 3000:3000 bullbrief
```

## Cron Configuration

For automatic data updates, configure a cron job to hit:

```
POST /api/brief/refresh
Authorization: Bearer <CRON_SECRET>
```

Recommended schedule: Every 15 minutes during market hours.

## API Plan Limitations

### Marketstack
- **Free tier:** 100 requests/month
- **Basic:** 10,000 requests/month
- Rate limit: 1 request/second

### Marketaux
- **Free tier:** 100 API credits/month
- **Basic:** 50,000 API credits/month

## Podcast API Setup

1. Sign up for a podcast API service
2. Set `PODCAST_API_KEY`, `PODCAST_API_USER_ID`, and `PODCAST_API_BASE_URL`
3. The app includes a mock provider for development without an API key

## License

MIT
