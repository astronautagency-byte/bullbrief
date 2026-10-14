ALTER TABLE "WatchlistItem"
ADD COLUMN IF NOT EXISTS "quantity" DECIMAL(20, 6),
ADD COLUMN IF NOT EXISTS "averageCost" DECIMAL(20, 6),
ADD COLUMN IF NOT EXISTS "currency" TEXT,
ADD COLUMN IF NOT EXISTS "householdLabel" TEXT,
ADD COLUMN IF NOT EXISTS "positionAsOf" TIMESTAMP(3);

UPDATE "WatchlistItem" AS item
SET
  "quantity" = CASE item."symbol"
    WHEN 'TD.TO' THEN 320
    WHEN 'ENB.TO' THEN 600
    WHEN 'RY.TO' THEN 180
    WHEN 'MSFT' THEN 90
    WHEN 'AAPL' THEN 120
    WHEN 'AMZN' THEN 70
    ELSE item."quantity"
  END,
  "averageCost" = CASE item."symbol"
    WHEN 'TD.TO' THEN 91.40
    WHEN 'ENB.TO' THEN 51.20
    WHEN 'RY.TO' THEN 128.75
    WHEN 'MSFT' THEN 384.10
    WHEN 'AAPL' THEN 196.80
    WHEN 'AMZN' THEN 178.25
    ELSE item."averageCost"
  END,
  "currency" = CASE WHEN item."symbol" LIKE '%.TO' THEN 'CAD' ELSE 'USD' END,
  "householdLabel" = 'Morgan household',
  "positionAsOf" = CURRENT_TIMESTAMP
FROM "Watchlist" AS watchlist
JOIN "User" AS app_user ON app_user."id" = watchlist."userId"
WHERE item."watchlistId" = watchlist."id"
  AND app_user."email" = 'advisor.demo@bullbrief.ca'
  AND item."symbol" IN ('TD.TO', 'ENB.TO', 'RY.TO', 'MSFT', 'AAPL', 'AMZN');

UPDATE "Watchlist" AS watchlist
SET "name" = 'Morgan household'
FROM "User" AS app_user
WHERE watchlist."userId" = app_user."id"
  AND app_user."email" = 'advisor.demo@bullbrief.ca'
  AND watchlist."isDefault" = TRUE;
