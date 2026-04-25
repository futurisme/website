CREATE TABLE IF NOT EXISTS public.fadhil_mindmaps (
  map_id BIGINT PRIMARY KEY,
  version BIGINT NOT NULL,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fadhil_mindmaps_updated_at
  ON public.fadhil_mindmaps(updated_at DESC);
