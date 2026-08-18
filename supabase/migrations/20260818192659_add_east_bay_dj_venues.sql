-- Add Albany to the East Bay region (needed for The Ivy Room below).
INSERT INTO public.cities (region_id, name)
SELECT id, 'Albany' FROM public.regions WHERE slug = 'east-bay'
ON CONFLICT DO NOTHING;

INSERT INTO public.venues (name, city, category, source_url, source_name, prompt_hint, active) VALUES
('The New Parish', 'Oakland', 'concerts', 'https://thenewparish.com/calendar/', 'The New Parish', 'Only include DJ nights, live music, and club events; skip private rentals.', true),
('LUX Pub & Club', 'Oakland', 'concerts', 'https://www.luxoakland.com/calendar', 'LUX Pub & Club', 'Only include DJ nights, dance parties, and live music; skip sports viewing parties and private events.', true),
('Legionnaire Saloon', 'Oakland', 'concerts', 'https://legionnairesaloon.com/calendar', 'Legionnaire Saloon', 'Only include DJ nights and live music; skip karaoke-only nights and private events.', true),
('The Ivy Room', 'Albany', 'concerts', 'https://www.ivyroom.com/', 'The Ivy Room', 'Only include DJ nights and live music shows; skip private events.', true)
ON CONFLICT (name, source_url, category) DO NOTHING;
