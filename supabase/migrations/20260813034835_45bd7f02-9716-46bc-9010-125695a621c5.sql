UPDATE public.events SET genre = 'Sports', updated_at = now()
WHERE artist ILIKE '%oakland roots%' OR artist ILIKE '%golden state warriors%' OR artist ILIKE '%oakland ballers%' OR artist ~* '\yvs\.?\y';

UPDATE public.events SET genre = 'Children', updated_at = now()
WHERE artist ILIKE '%story time%' OR artist ILIKE '%storytime%' OR artist ILIKE '%kids%' OR artist ILIKE '%children%' OR artist ILIKE '%toddler%' OR artist ILIKE '%preschool%';