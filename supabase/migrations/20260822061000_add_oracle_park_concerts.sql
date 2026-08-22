INSERT INTO public.venues (name, city, category, source_url, source_name, prompt_hint, active, lat, lng) VALUES
('Oracle Park', 'San Francisco', 'concerts', 'https://www.livenation.com/venue/KovZpZAJF7EA/oracle-park-events', 'Live Nation', 'Only include concerts and public shows; skip Giants baseball games and private rentals.', true, 37.7786, -122.3893)
ON CONFLICT (name, source_url, category) DO NOTHING;
