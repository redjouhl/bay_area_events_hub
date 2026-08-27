-- Paramount Theatre's only DB row scraped Live Nation's aggregator page,
-- which only lists Live Nation-ticketed shows — it's missing events the
-- venue hosts through other promoters, e.g. Oakland Ballet's "Luna
-- Mexicana". Point it at the venue's own /events page instead, which
-- carries the full calendar. There was also no 'classical' or 'comedy'
-- row for this venue, so ballet/dance/orchestral shows and stand-up sets
-- (e.g. Martin Lawrence) had nowhere to be correctly classified —
-- everything was forced through the 'concerts' schema. Split it three
-- ways, each scraping the same page but keeping only its slice.
--
-- Also clear out what's already scraped for this venue under the old,
-- wrong config (comedy/classical shows misfiled as 'concerts', some with
-- a stray link fragment like "/buy-tickets" stuck in the price field —
-- see the cleanPrice() guard added alongside this). The next scrape will
-- repopulate correctly; without this, the old bad rows would just sit
-- alongside the new correct ones as duplicates, since a category change
-- changes the fingerprint instead of overwriting the old row.
DELETE FROM public.events WHERE venue = 'Paramount Theatre';

UPDATE public.venues
SET
  source_url = 'https://www.paramountoakland.org/events',
  prompt_hint = 'Only include live music concerts; skip comedy/stand-up sets and classical, symphony, opera, orchestral, and ballet/dance performances.',
  updated_at = now()
WHERE name = 'Paramount Theatre' AND source_url = 'https://www.livenation.com/venue/KovZpZAFkIlA/paramount-theatre-oakland-events' AND category = 'concerts';

INSERT INTO public.venues (name, city, category, source_url, source_name, prompt_hint, active) VALUES
('Paramount Theatre', 'Oakland', 'classical', 'https://www.paramountoakland.org/events', 'Paramount Theatre Oakland', 'Only include classical, symphony, opera, orchestral, and ballet/dance performances (e.g. Oakland Ballet''s Luna Mexicana); skip comedy and other live music concerts.', true),
('Paramount Theatre', 'Oakland', 'comedy', 'https://www.paramountoakland.org/events', 'Paramount Theatre Oakland', 'Only include comedy shows and stand-up specials (e.g. Martin Lawrence, Mojo Brookzz); skip music concerts and classical/ballet performances.', true)
ON CONFLICT (name, source_url, category) DO NOTHING;
