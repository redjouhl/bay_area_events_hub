ALTER TABLE public.events ADD COLUMN category text NOT NULL DEFAULT 'concerts';
CREATE INDEX IF NOT EXISTS events_category_date_idx ON public.events(category, date);