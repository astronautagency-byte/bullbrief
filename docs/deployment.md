# Deployment

## Vercel (Recommended)

1. Push code to GitHub
2. Import in Vercel dashboard
3. Configure environment variables
4. Deploy

### Environment Variables for Vercel

Set all variables from `.env.example` in the Vercel dashboard.

### Database

Use a managed PostgreSQL service (Supabase, Neon, etc.) and set `DATABASE_URL`.

## Docker

```bash
docker build -t bullbrief .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e AUTH_SECRET="your-secret" \
  -e MARKETSTACK_API_KEY="your-key" \
  -e MARKETAUX_API_TOKEN="your-token" \
  bullbrief
```

## Self-Hosted

1. Build the application: `npm run build`
2. Start: `npm start`
3. Ensure PostgreSQL is accessible
4. Run migrations: `npx prisma migrate deploy`

## Cron Jobs

Configure a cron job to refresh the daily brief:

```bash
# Every 15 minutes during market hours (9:30 AM - 4:00 PM ET)
*/15 9-16 * * 1-5 curl -X POST https://your-domain.com/api/brief/refresh \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## SSL/TLS

Ensure HTTPS is enabled in production. Most hosting providers handle this automatically.
