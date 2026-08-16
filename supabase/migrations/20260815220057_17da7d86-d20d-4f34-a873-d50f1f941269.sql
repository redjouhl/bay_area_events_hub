INSERT INTO public.venues (name, city, category, source_url, source_name, prompt_hint, active) VALUES
('Cheaper Than Therapy','San Francisco','comedy','https://www.cheapertherapy.com/','Cheaper Than Therapy',NULL,true),
('The Palace Theater','San Francisco','comedy','https://www.thepalacesf.com/','The Palace Theater SF','Only include comedy shows, stand-up, and improv; skip music-only events.',true),
('The Lost Church','San Francisco','comedy','https://www.thelostchurch.com/sf-calendar','The Lost Church','Only include comedy shows, stand-up, storytelling, and improv; skip music concerts.',true),
('The Valencia Room','San Francisco','comedy','https://www.thevalenciaroom.com/','The Valencia Room','Only include comedy shows; skip club nights and music-only events.',true),
('The Spotlight Comedy','San Francisco','comedy','https://www.spotlightcomedysf.com/','The Spotlight Comedy',NULL,true),
('Bit City Comedy','San Francisco','comedy','https://www.bitcitycomedy.com/','Bit City Comedy',NULL,true),
('Milk Bar','San Francisco','comedy','https://milkbarsf.com/calendar/','Milk Bar','Only include comedy shows and open mics; skip music-only events.',true),
('Comet Club','San Francisco','comedy','https://www.cometclubsf.com/','Comet Club','Only include comedy shows; skip DJ and club nights.',true),
('SF Comedy Underground','San Francisco','comedy','https://www.sfcomedyunderground.com/','SF Comedy Underground',NULL,true),
('Mirthquake','San Francisco','comedy','https://www.mirthquakecomedy.com/','Mirthquake',NULL,true),
('Don''t Tell Comedy','San Francisco','comedy','https://www.donttellcomedy.com/cities/san-francisco','Don''t Tell Comedy','Secret-location pop-up shows in San Francisco; use the announced neighborhood as the venue detail.',true),
('The Masonic','San Francisco','comedy','https://www.livenation.com/venue/KovZpZAJ6nlA/the-masonic-events','Live Nation','Only include comedy shows and stand-up specials; skip music concerts.',true),
('Golden Gate Theatre','San Francisco','comedy','https://www.broadwaysf.com/events','BroadwaySF','Only include comedy shows at the Golden Gate Theatre; skip musicals, plays, and other theaters.',true),
('Curran Theatre','San Francisco','comedy','https://www.sfcurran.com/whats-on/','Curran Theatre','Only include comedy shows and stand-up; skip musicals and plays.',true),
('Orpheum Theatre','San Francisco','comedy','https://www.broadwaysf.com/events','BroadwaySF','Only include comedy shows at the Orpheum Theatre; skip musicals, plays, and other theaters.',true)
ON CONFLICT (name, source_url, category) DO NOTHING;