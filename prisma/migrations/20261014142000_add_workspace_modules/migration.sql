ALTER TABLE "UserPreference"
ADD COLUMN "workspaceModules" TEXT[] NOT NULL
DEFAULT ARRAY['watchlist', 'markets', 'picks', 'kyp', 'news', 'podcasts', 'saved']::TEXT[];
