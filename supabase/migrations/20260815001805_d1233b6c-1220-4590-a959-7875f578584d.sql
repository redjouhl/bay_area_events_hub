-- Merge South Bay and Peninsula into one region
BEGIN;

-- Rename South Bay to cover both areas
UPDATE public.regions
SET name = 'South Bay & Peninsula', slug = 'south-bay-peninsula'
WHERE slug = 'south-bay';

-- Move Peninsula cities under the South Bay region
UPDATE public.cities
SET region_id = (SELECT id FROM public.regions WHERE slug = 'south-bay-peninsula')
WHERE region_id = (SELECT id FROM public.regions WHERE slug = 'peninsula');

-- Remove the now-empty Peninsula region
DELETE FROM public.regions WHERE slug = 'peninsula';

COMMIT;