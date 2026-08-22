INSERT INTO public.venues (name, city, category, source_url, source_name, prompt_hint, active) VALUES
('American Conservatory Theater', 'San Francisco', 'theater', 'https://www.act-sf.org/whats-on', 'American Conservatory Theater', NULL, true),
('SF Playhouse', 'San Francisco', 'theater', 'https://sfplayhouse.org/calendar/', 'SF Playhouse', NULL, true),
('Golden Gate Theatre', 'San Francisco', 'theater', 'https://www.broadwaysf.com/events', 'BroadwaySF', 'Only include musicals and plays at the Golden Gate Theatre; skip comedy specials and other theaters.', true),
('Curran Theatre', 'San Francisco', 'theater', 'https://www.sfcurran.com/whats-on/', 'Curran Theatre', 'Only include musicals and plays; skip comedy shows and stand-up.', true),
('Orpheum Theatre', 'San Francisco', 'theater', 'https://www.broadwaysf.com/events', 'BroadwaySF', 'Only include musicals and plays at the Orpheum Theatre; skip comedy specials and other theaters.', true),
('Magic Theatre', 'San Francisco', 'theater', 'https://magictheatre.org/calendar', 'Magic Theatre', NULL, true),
('Berkeley Repertory Theatre', 'Berkeley', 'theater', 'https://www.berkeleyrep.org/shows', 'Berkeley Repertory Theatre', NULL, true),
('TheatreWorks Silicon Valley', 'Palo Alto', 'theater', 'https://theatreworks.org/mainstage/', 'TheatreWorks Silicon Valley', NULL, true)
ON CONFLICT (name, source_url, category) DO NOTHING;
