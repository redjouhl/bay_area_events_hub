-- Fox Theater Oakland had only a single 'concerts' row, so comedy shows
-- (e.g. "Hasan Hates Ronny | Ronny Hates Hasan" ft. Hasan Minhaj and Ronny
-- Chieng, Fortune Feimster, Ilana Glazer, Ali Siddiq) were being forced
-- through the concerts schema. Add a 'comedy' row for the same page and
-- tell 'concerts' to skip comedy now that it has somewhere to go.
--
-- Also clear existing scraped events for this venue so the next run
-- repopulates cleanly instead of leaving the old miscategorized rows
-- sitting alongside newly-correct ones (category change = new
-- fingerprint, not an overwrite).
DELETE FROM public.events WHERE venue = 'Fox Theater Oakland';

UPDATE public.venues
SET prompt_hint = 'Only include live music concerts; skip comedy and stand-up specials.', updated_at = now()
WHERE name = 'Fox Theater Oakland' AND source_url = 'https://thefoxoakland.com/' AND category = 'concerts';

INSERT INTO public.venues (name, city, category, source_url, source_name, prompt_hint, active) VALUES
('Fox Theater Oakland', 'Oakland', 'comedy', 'https://thefoxoakland.com/', 'Fox Theater Oakland', 'Only include comedy shows and stand-up specials (e.g. Hasan Minhaj, Ronny Chieng, Fortune Feimster, Ilana Glazer, Ali Siddiq); skip music concerts.', true)
ON CONFLICT (name, source_url, category) DO NOTHING;
