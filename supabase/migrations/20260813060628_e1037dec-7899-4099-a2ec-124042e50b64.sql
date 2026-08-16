-- Markets / regions / cities
CREATE TABLE public.markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Los_Angeles',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.markets TO anon, authenticated;
GRANT ALL ON public.markets TO service_role;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Markets are publicly readable" ON public.markets FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.regions TO anon, authenticated;
GRANT ALL ON public.regions TO service_role;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Regions are publicly readable" ON public.regions FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cities TO anon, authenticated;
GRANT ALL ON public.cities TO service_role;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cities are publicly readable" ON public.cities FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'concerts',
  source_url text NOT NULL,
  source_name text NOT NULL,
  prompt_hint text,
  scraper_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  timezone text NOT NULL DEFAULT 'America/Los_Angeles',
  active boolean NOT NULL DEFAULT true,
  last_scraped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, source_url, category)
);
GRANT SELECT ON public.venues TO anon, authenticated;
GRANT ALL ON public.venues TO service_role;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venues are publicly readable" ON public.venues FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX venues_category_active_idx ON public.venues (category, active);

CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON public.markets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON public.regions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON public.cities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Events pipeline columns
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS raw_data jsonb,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';
CREATE INDEX IF NOT EXISTS events_status_idx ON public.events (status);
CREATE INDEX IF NOT EXISTS events_venue_id_idx ON public.events (venue_id);

-- Scrape logs per venue per run
ALTER TABLE public.scrape_runs
  ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS run_id uuid;

-- Seed the Bay Area market
INSERT INTO public.markets (slug, name, sort_order) VALUES ('bay-area', 'Bay Area', 0);

INSERT INTO public.regions (market_id, slug, name, sort_order)
SELECT m.id, x.slug, x.name, x.sort
FROM public.markets m,
  (VALUES ('san-francisco','San Francisco',0),('east-bay','East Bay',1),('south-bay','South Bay',2),('north-bay','North Bay',3),('peninsula','Peninsula',4))
  AS x(slug,name,sort)
WHERE m.slug = 'bay-area';

INSERT INTO public.cities (region_id, name)
SELECT r.id, c.name FROM public.regions r,
  (VALUES
    ('san-francisco','San Francisco'),
    ('east-bay','Oakland'),('east-bay','Berkeley'),('east-bay','Richmond'),('east-bay','Walnut Creek'),('east-bay','Alameda'),
    ('south-bay','San Jose'),('south-bay','Mountain View'),('south-bay','Santa Clara'),('south-bay','Sunnyvale'),('south-bay','Campbell'),
    ('north-bay','San Rafael'),('north-bay','Novato'),('north-bay','Santa Rosa'),('north-bay','Napa'),('north-bay','Vallejo'),('north-bay','Petaluma'),('north-bay','Sausalito'),('north-bay','Mill Valley'),('north-bay','San Anselmo'),('north-bay','Tiburon'),('north-bay','Larkspur'),('north-bay','Corte Madera'),('north-bay','Fairfax'),
    ('peninsula','Palo Alto'),('peninsula','Stanford'),('peninsula','Redwood City'),('peninsula','San Mateo'),('peninsula','Burlingame'),('peninsula','Daly City')
  ) AS c(region_slug, name)
WHERE r.slug = c.region_slug;

-- Seed venues from the current hardcoded list
INSERT INTO public.venues (name, city, category, source_url, source_name, prompt_hint) VALUES
  ('Chase Center', 'San Francisco', 'concerts', 'https://www.chasecenter.com/events', 'Chase Center', NULL),
  ('Bill Graham Civic Auditorium', 'San Francisco', 'concerts', 'https://www.livenation.com/venue/KovZpZAEAlvA/bill-graham-civic-auditorium-events', 'Live Nation', NULL),
  ('The Masonic', 'San Francisco', 'concerts', 'https://www.livenation.com/venue/KovZpZAJ6nlA/the-masonic-events', 'Live Nation', NULL),
  ('The Warfield', 'San Francisco', 'concerts', 'https://www.thewarfieldtheatre.com/events', 'The Warfield', NULL),
  ('The Regency Ballroom', 'San Francisco', 'concerts', 'https://www.theregencyballroom.com/events', 'The Regency Ballroom', NULL),
  ('Bimbo''s 365 Club', 'San Francisco', 'concerts', 'https://bimbos365club.com/calendar/', 'Bimbo''s 365 Club', NULL),
  ('The Fillmore', 'San Francisco', 'concerts', 'https://www.thefillmore.com/events', 'The Fillmore', NULL),
  ('The Independent', 'San Francisco', 'concerts', 'https://www.theindependentsf.com/', 'The Independent', NULL),
  ('The Great American Music Hall', 'San Francisco', 'concerts', 'https://gamh.com/calendar/', 'Great American Music Hall', NULL),
  ('Bottom of the Hill', 'San Francisco', 'concerts', 'https://www.bottomofthehill.com/calendar.html', 'Bottom of the Hill', NULL),
  ('Rickshaw Stop', 'San Francisco', 'concerts', 'https://rickshawstop.com/', 'Rickshaw Stop', NULL),
  ('The Lost Church', 'San Francisco', 'concerts', 'https://www.thelostchurch.com/sf-calendar', 'The Lost Church', NULL),
  ('The Chapel', 'San Francisco', 'concerts', 'https://thechapelsf.com/calendar/', 'The Chapel', NULL),
  ('Thee Parkside', 'San Francisco', 'concerts', 'https://theeparkside.com/', 'Thee Parkside', NULL),
  ('Make-Out Room', 'San Francisco', 'concerts', 'https://makeoutroom.com/calendar/', 'Make-Out Room', NULL),
  ('El Rio', 'San Francisco', 'concerts', 'https://www.elriosf.com/calendar', 'El Rio', NULL),
  ('DNA Lounge', 'San Francisco', 'concerts', 'https://www.dnalounge.com/calendar/', 'DNA Lounge', NULL),
  ('The Hotel Utah Saloon', 'San Francisco', 'concerts', 'https://hotelutahsaloon.com/calendar/', 'Hotel Utah Saloon', NULL),
  ('SFJAZZ Center', 'San Francisco', 'concerts', 'https://www.sfjazz.org/tickets/calendar/', 'SFJAZZ', NULL),
  ('The Boom Boom Room', 'San Francisco', 'concerts', 'https://boomboomroom.com/calendar/', 'Boom Boom Room', NULL),
  ('Biscuits and Blues', 'San Francisco', 'concerts', 'https://www.biscuitsandblues.com/calendar', 'Biscuits and Blues', NULL),
  ('Sheba Piano Lounge', 'San Francisco', 'concerts', 'https://shebapianolounge.com/', 'Sheba Piano Lounge', NULL),
  ('Golden Gate Park', 'San Francisco', 'concerts', 'https://goldengatepark.com/events', 'Golden Gate Park', NULL),
  ('The Greek Theatre', 'Berkeley', 'concerts', 'https://thegreekberkeley.com/', 'The Greek Theatre Berkeley', NULL),
  ('The Henry J', 'Berkeley', 'concerts', 'https://www.thehenryj.org/', 'The Henry J', NULL),
  ('The UC Theatre', 'Berkeley', 'concerts', 'https://www.theuctheatre.org/events/', 'The UC Theatre', NULL),
  ('Zellerbach Hall', 'Berkeley', 'concerts', 'https://calperformances.org/calendar/', 'Cal Performances', NULL),
  ('Freight & Salvage', 'Berkeley', 'concerts', 'https://thefreight.org/shows/', 'Freight & Salvage', NULL),
  ('Ashkenaz Music & Dance Community Center', 'Berkeley', 'concerts', 'https://www.ashkenaz.com/full-calendar', 'Ashkenaz', NULL),
  ('924 Gilman', 'Berkeley', 'concerts', 'https://924gilman.org/calendar/', '924 Gilman', NULL),
  ('The Starry Plough', 'Berkeley', 'concerts', 'https://starryploughpub.com/', 'The Starry Plough', NULL),
  ('Cornerstone Berkeley', 'Berkeley', 'concerts', 'https://www.prekindle.com/events/cornerstone', 'Cornerstone Berkeley', NULL),
  ('Fox Theater Oakland', 'Oakland', 'concerts', 'https://thefoxoakland.com/', 'Fox Theater Oakland', NULL),
  ('Oakland Arena', 'Oakland', 'concerts', 'https://www.theoaklandarena.com/events', 'Oakland Arena', NULL),
  ('Yoshi''s', 'Oakland', 'concerts', 'https://yoshis.com/calendar/', 'Yoshi''s Oakland', NULL),
  ('Paramount Theatre', 'Oakland', 'concerts', 'https://www.livenation.com/venue/KovZpZAFkIlA/paramount-theatre-oakland-events', 'Paramount Theatre Oakland', NULL),
  ('SAP Center', 'San Jose', 'concerts', 'https://www.sapcenter.com/events', 'SAP Center', NULL),
  ('The Ritz', 'San Jose', 'concerts', 'https://theritzsanjose.com/', 'The Ritz San Jose', NULL),
  ('Hammer Theatre Center', 'San Jose', 'concerts', 'https://hammertheatre.com/events/', 'Hammer Theatre Center', NULL),
  ('San Jose Improv', 'San Jose', 'concerts', 'https://improv.com/sanjose/', 'San Jose Improv', NULL),
  ('San Jose Civic', 'San Jose', 'concerts', 'https://sanjosetheaters.org/calendar/', 'San Jose Theaters', 'This calendar covers several halls. Only include events held at the San Jose Civic; skip every event at any other theater.'),
  ('San Jose Center for the Performing Arts', 'San Jose', 'concerts', 'https://sanjosetheaters.org/calendar/', 'San Jose Theaters', 'This calendar covers several halls. Only include events held at the San Jose Center for the Performing Arts; skip every event at any other theater.'),
  ('California Theatre', 'San Jose', 'concerts', 'https://sanjosetheaters.org/calendar/', 'San Jose Theaters', 'This calendar covers several halls. Only include events held at the California Theatre; skip every event at any other theater.'),
  ('Montgomery Theatre', 'San Jose', 'concerts', 'https://sanjosetheaters.org/calendar/', 'San Jose Theaters', 'This calendar covers several halls. Only include events held at the Montgomery Theatre; skip every event at any other theater.'),
  ('Discovery Meadow', 'San Jose', 'concerts', 'https://www.sanjose.org/events', 'Visit San Jose', 'Only include events taking place at Discovery Meadow or Arena Green East; skip everything at other locations.'),
  ('SFMOMA', 'San Francisco', 'museums_exhibits', 'https://www.sfmoma.org/exhibitions/', 'SFMOMA', NULL),
  ('de Young Museum', 'San Francisco', 'museums_exhibits', 'https://deyoung.famsf.org/exhibitions', 'de Young Museum', NULL),
  ('Legion of Honor', 'San Francisco', 'museums_exhibits', 'https://legionofhonor.famsf.org/exhibitions', 'Legion of Honor', NULL),
  ('Asian Art Museum', 'San Francisco', 'museums_exhibits', 'https://asianart.org/exhibitions/', 'Asian Art Museum', NULL),
  ('Exploratorium', 'San Francisco', 'museums_exhibits', 'https://www.exploratorium.edu/visit/calendar', 'Exploratorium', NULL),
  ('California Academy of Sciences', 'San Francisco', 'museums_exhibits', 'https://www.calacademy.org/visit', 'California Academy of Sciences', NULL),
  ('Contemporary Jewish Museum', 'San Francisco', 'museums_exhibits', 'https://thecjm.org/exhibitions/', 'Contemporary Jewish Museum', NULL),
  ('Museum of Craft and Design', 'San Francisco', 'museums_exhibits', 'https://sfmcd.org/exhibitions/', 'Museum of Craft and Design', NULL),
  ('Yerba Buena Center for the Arts', 'San Francisco', 'museums_exhibits', 'https://ybca.org/whats-on/', 'Yerba Buena Center for the Arts', NULL),
  ('Oakland Museum of California', 'Oakland', 'museums_exhibits', 'https://museumca.org/exhibitions', 'Oakland Museum of California', NULL),
  ('BAMPFA', 'Berkeley', 'museums_exhibits', 'https://bampfa.org/program/film-exhibitions', 'BAMPFA', NULL),
  ('Lawrence Hall of Science', 'Berkeley', 'museums_exhibits', 'https://lawrencehallofscience.org/visit/exhibits/', 'Lawrence Hall of Science', NULL),
  ('Chabot Space & Science Center', 'Oakland', 'museums_exhibits', 'https://chabotspace.org/visit/exhibits/', 'Chabot Space & Science Center', NULL),
  ('San Jose Museum of Art', 'San Jose', 'museums_exhibits', 'https://sjma.org/exhibitions/', 'San Jose Museum of Art', NULL),
  ('The Tech Interactive', 'San Jose', 'museums_exhibits', 'https://www.thetech.org/exhibits-activities', 'The Tech Interactive', NULL),
  ('Computer History Museum', 'Mountain View', 'museums_exhibits', 'https://computerhistory.org/visit/exhibits/', 'Computer History Museum', NULL),
  ('Cantor Arts Center', 'Stanford', 'museums_exhibits', 'https://cantorarts.stanford.edu/exhibitions', 'Cantor Arts Center', NULL),
  ('San Jose Museum of Quilts & Textiles', 'San Jose', 'museums_exhibits', 'https://sanjosequiltmuseum.org/exhibitions/', 'San Jose Museum of Quilts & Textiles', NULL),
  ('Museum of Palo Alto', 'Palo Alto', 'museums_exhibits', 'https://museumofpaloalto.org/', 'Museum of Palo Alto', NULL),
  ('The Museum of Creativity', 'San Francisco', 'museums_exhibits', 'https://www.themuseumofcreativity.org/', 'Museum of Creativity', NULL),
  ('San Francisco Railway Museum', 'San Francisco', 'museums_exhibits', 'https://www.streetcar.org/railway-museum/', 'San Francisco Railway Museum', NULL),
  ('Davies Symphony Hall', 'San Francisco', 'classical', 'https://www.sfsymphony.org/Buy-Tickets/Calendar', 'San Francisco Symphony', NULL),
  ('War Memorial Opera House', 'San Francisco', 'classical', 'https://www.sfopera.com/on-stage/calendar/', 'San Francisco Opera', 'Only include opera performances staged at the War Memorial Opera House.'),
  ('War Memorial Opera House', 'San Francisco', 'classical', 'https://www.sfballet.org/performances/', 'San Francisco Ballet', 'These are San Francisco Ballet performances at the War Memorial Opera House.'),
  ('Herbst Theatre', 'San Francisco', 'classical', 'https://sfwmpac.org/calendar/', 'SF War Memorial & Performing Arts Center', 'Only include events taking place in Herbst Theatre; skip other halls.'),
  ('San Francisco Conservatory of Music', 'San Francisco', 'classical', 'https://sfcm.edu/performance-calendar', 'SF Conservatory of Music', NULL),
  ('Grace Cathedral', 'San Francisco', 'classical', 'https://gracecathedral.org/events/', 'Grace Cathedral', 'Only include concerts, recitals, and musical performances; skip worship services and tours.'),
  ('Mission Dolores Basilica', 'San Francisco', 'classical', 'https://www.missiondolores.org/events/', 'Mission Dolores Basilica', 'Only include concerts and musical performances; skip masses and parish meetings.'),
  ('Old First Church', 'San Francisco', 'classical', 'https://www.oldfirstconcerts.org/calendar/', 'Old First Concerts', NULL),
  ('Curran Theatre', 'San Francisco', 'classical', 'https://www.sfcurran.com/whats-on/', 'Curran Theatre', NULL)
ON CONFLICT (name, source_url, category) DO NOTHING;

UPDATE public.venues v SET city_id = c.id FROM public.cities c WHERE c.name = v.city AND v.city_id IS NULL;

UPDATE public.events e SET venue_id = v.id
FROM public.venues v
WHERE e.venue_id IS NULL AND v.name = e.venue AND v.category = e.category;