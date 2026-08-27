-- The Henry J's calendar was pointed at the bare homepage (no event grid
-- there — it's a separate /upcoming-events page) and was a single
-- 'concerts' row, so the scraper had nothing to read and, even once fixed,
-- would have force-tagged every event (exhibits, galas, classical, panels)
-- as a concert. Split it into one row per category, each scraping the same
-- calendar page but told to keep only its slice of the mix.
DELETE FROM public.venues WHERE name = 'The Henry J' AND source_url = 'https://www.thehenryj.org/';

INSERT INTO public.venues (name, city, category, source_url, source_name, prompt_hint, active) VALUES
('The Henry J', 'Oakland', 'concerts', 'https://www.thehenryj.org/upcoming-events', 'The Henry J', 'Only include live music and variety shows (including family-friendly music shows like kids concerts or holiday music productions); skip art exhibits, galas, film screenings, panels, and Berkeley Symphony performances (that''s classical).', true),
('The Henry J', 'Oakland', 'classical', 'https://www.thehenryj.org/upcoming-events', 'The Henry J', 'Only include Berkeley Symphony performances and other classical/orchestral concerts; skip everything else.', true),
('The Henry J', 'Oakland', 'museums_exhibits', 'https://www.thehenryj.org/upcoming-events', 'The Henry J', 'Only include art exhibits and immersive experiences, such as The Banksy Art Exhibit and Dinos Alive; skip concerts, galas, and panels.', true),
('The Henry J', 'Oakland', 'other', 'https://www.thehenryj.org/upcoming-events', 'The Henry J', 'Only include galas, fundraisers, film screenings, book talks, and panel discussions; skip concerts, exhibits, and classical performances.', true)
ON CONFLICT (name, source_url, category) DO NOTHING;
