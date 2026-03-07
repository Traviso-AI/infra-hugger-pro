UPDATE trips
SET cover_image_url = NULL
WHERE cover_image_url LIKE 'https://images.unsplash.com/%'
  AND cover_image_url NOT LIKE '%hmogswuliehwbmcyzfie.supabase.co%';