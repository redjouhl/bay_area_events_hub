INSERT INTO public.venues (name, city, category, source_url, source_name, prompt_hint, active) VALUES
('Public Works', 'San Francisco', 'concerts', 'https://publicsf.com/calendar/', 'Public Works', 'Only include DJ nights, club events, and live shows; skip private rentals.', true),
('Monarch', 'San Francisco', 'concerts', 'https://www.monarchsf.com/', 'Monarch', 'Only include DJ nights and club events; skip private rentals.', true),
('F8', 'San Francisco', 'concerts', 'http://www.feightsf.com/new-events', 'F8', 'Only include DJ nights and club events; skip private rentals.', true),
('Audio', 'San Francisco', 'concerts', 'https://audiosf.com/events', 'Audio', 'Only include DJ nights and club events; skip private rentals.', true),
('The Great Northern', 'San Francisco', 'concerts', 'https://www.thegreatnorthernsf.com/', 'The Great Northern', 'Only include DJ nights, label showcases, and touring artist events; skip private rentals.', true),
('Halcyon SF', 'San Francisco', 'concerts', 'https://halcyon-sf.com/main/', 'Halcyon SF', 'Only include DJ nights and club events; skip private rentals.', true),
('Underground SF', 'San Francisco', 'concerts', 'https://undergroundsf.com/', 'Underground SF', 'Only include DJ nights and club events; skip private rentals.', true),
('1015 Folsom', 'San Francisco', 'concerts', 'https://1015.com/', '1015 Folsom', 'Only include DJ nights and club events; skip private rentals.', true),
('Eve Nightclub', 'San Francisco', 'concerts', 'https://evesf.com/', 'Eve Nightclub', 'Only include DJ nights and club events; skip private rentals.', true),
('YOLO Nightclub', 'San Francisco', 'concerts', 'https://www.yolonightclub.com/', 'YOLO Nightclub', 'Only include DJ nights and club events; skip private rentals.', true),
('Hawthorn', 'San Francisco', 'concerts', 'https://hawthornsf.com/nightlife-events/', 'Hawthorn', 'Only include DJ nights and club events; skip private rentals.', true),
('Cat Club', 'San Francisco', 'concerts', 'https://www.sfcatclub.com/', 'Cat Club', 'Only include DJ nights and themed club events; skip private rentals.', true),
('The Valencia Room', 'San Francisco', 'concerts', 'https://www.thevalenciaroom.com/', 'The Valencia Room', 'Only include DJ nights and club/dance events; skip comedy shows and private rentals.', true)
ON CONFLICT (name, source_url, category) DO NOTHING;
