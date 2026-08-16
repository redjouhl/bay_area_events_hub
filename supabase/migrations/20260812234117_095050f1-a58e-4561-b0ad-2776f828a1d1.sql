CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint TEXT NOT NULL UNIQUE,
  artist TEXT NOT NULL,
  support TEXT,
  venue TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'San Francisco',
  date DATE NOT NULL,
  time TEXT,
  genre TEXT NOT NULL DEFAULT 'Rock',
  price TEXT,
  ticket_url TEXT NOT NULL,
  source TEXT NOT NULL,
  trending BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are publicly readable"
ON public.events FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX events_date_idx ON public.events (date);
CREATE INDEX events_venue_idx ON public.events (venue);

CREATE TABLE public.scrape_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue TEXT NOT NULL,
  source_url TEXT NOT NULL,
  events_found INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ok',
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.scrape_runs TO anon;
GRANT SELECT ON public.scrape_runs TO authenticated;
GRANT ALL ON public.scrape_runs TO service_role;

ALTER TABLE public.scrape_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scrape runs are publicly readable"
ON public.scrape_runs FOR SELECT
TO anon, authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();