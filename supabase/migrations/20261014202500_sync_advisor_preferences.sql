ALTER TABLE "UserPreference"
ADD COLUMN IF NOT EXISTS "workspaceModules" TEXT[] NOT NULL
DEFAULT ARRAY['watchlist', 'markets', 'picks', 'kyp', 'news', 'podcasts', 'saved']::TEXT[];

ALTER TABLE "UserPreference"
ADD COLUMN IF NOT EXISTS "companyName" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "brandColor" TEXT NOT NULL DEFAULT '#4be277';
