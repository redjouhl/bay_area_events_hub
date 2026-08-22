INSERT INTO public.venues (name, city, category, source_url, source_name, prompt_hint, active) VALUES
('Chase Center', 'San Francisco', 'sports', 'https://www.espn.com/nba/team/schedule/_/name/gs/golden-state-warriors', 'Golden State Warriors', 'Only include home games at Chase Center; a game marked as being at a neutral location or another arena is not a home game, skip it.', true),
('Oracle Park', 'San Francisco', 'sports', 'https://www.espn.com/mlb/team/schedule/_/name/sf/san-francisco-giants', 'San Francisco Giants', 'Only include games marked as home (vs) games; skip games marked away (@).', true),
('Levi''s Stadium', 'Santa Clara', 'sports', 'https://www.49ers.com/schedule/', 'San Francisco 49ers', NULL, true),
('SAP Center', 'San Jose', 'sports', 'https://www.nhl.com/sharks/schedule', 'San Jose Sharks', NULL, true),
('Oakland Coliseum', 'Oakland', 'sports', 'https://oaklandrootssc.com/schedule/', 'Oakland Roots SC', NULL, true)
ON CONFLICT (name, source_url, category) DO NOTHING;
