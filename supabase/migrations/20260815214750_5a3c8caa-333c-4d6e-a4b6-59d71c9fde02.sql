UPDATE public.venues SET category = 'comedy', updated_at = now() WHERE name = 'San Jose Improv';

INSERT INTO public.venues (name, city, city_id, category, source_url, source_name, prompt_hint, active)
VALUES
  ('Punch Line San Francisco', 'San Francisco', (SELECT id FROM public.cities WHERE name = 'San Francisco'), 'comedy', 'https://www.punchlinecomedyclub.com/shows', 'Punch Line SF', 'This club is in San Francisco, not Oakland. Include every stand-up comedy show and showcase.', true),
  ('Cobb''s Comedy Club', 'San Francisco', (SELECT id FROM public.cities WHERE name = 'San Francisco'), 'comedy', 'https://www.cobbscomedy.com/shows', 'Cobb''s Comedy Club', NULL, true),
  ('The Setup Comedy Club', 'San Francisco', (SELECT id FROM public.cities WHERE name = 'San Francisco'), 'comedy', 'https://www.thesetupsf.com/', 'The Setup SF', NULL, true),
  ('Comedy Oakland', 'Oakland', (SELECT id FROM public.cities WHERE name = 'Oakland'), 'comedy', 'https://comedyoakland.com/', 'Comedy Oakland', NULL, true),
  ('Tommy T''s Comedy Club', 'Pleasanton', NULL, 'comedy', 'https://www.tommyts.com/', 'Tommy T''s', NULL, true)
ON CONFLICT DO NOTHING;

UPDATE public.events SET category = 'comedy', updated_at = now() WHERE venue = 'San Jose Improv';