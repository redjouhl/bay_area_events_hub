INSERT INTO public.venues (name, city, category, source_url, source_name, prompt_hint, active, lat, lng) VALUES
('Club Fox', 'Redwood City', 'concerts', 'https://clubfoxrwc.com/', 'Club Fox', 'Only include live music shows, DJ nights, and comedy; skip venue rental listings and past-stream archive links.', true, 37.4863, -122.2296)
ON CONFLICT (name, source_url, category) DO NOTHING;
