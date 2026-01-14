-- Add cancelled_at timestamp for campaigns
-- This supports a terminal CANCELLED status (user-cancelled send).

ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS campaigns_cancelled_at_idx
ON public.campaigns (cancelled_at);
