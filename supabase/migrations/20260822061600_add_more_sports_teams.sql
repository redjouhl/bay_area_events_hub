INSERT INTO public.venues (name, city, category, source_url, source_name, prompt_hint, active, lat, lng) VALUES
('Raimondi Park', 'Oakland', 'sports', 'https://tickets.oaklandballers.com/', 'Oakland Ballers', NULL, true, 37.8161, -122.2938),
('Oakland Coliseum', 'Oakland', 'sports', 'https://www.sfunicorns.com/matches/', 'San Francisco Unicorns', 'Only include matches actually played at Oakland Coliseum; skip matches at other venues like Grand Prairie Stadium or Pomona.', true, 37.7516, -122.2005),
('PayPal Park', 'San Jose', 'sports', 'https://bayfc.com/schedule/', 'Bay FC', NULL, true, 37.3513, -121.9247),
('Chase Center', 'San Francisco', 'sports', 'https://www.espn.com/wnba/team/schedule/_/name/gs/golden-state-valkyries', 'Golden State Valkyries', NULL, true, 37.7679, -122.3874),
('PayPal Park', 'San Jose', 'sports', 'https://www.espn.com/soccer/team/fixtures/_/id/191/san-jose-earthquakes', 'San Jose Earthquakes', NULL, true, 37.3513, -121.9247)
ON CONFLICT (name, source_url, category) DO NOTHING;
