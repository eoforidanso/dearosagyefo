-- Fix all audioUrl values to remove timestamps and point to correct S3 files
-- Old format: https://dearosagyefo.com/audio/letter-5-1778030599852.mp3
-- New format: https://dearosagyefo.com/audio/letter-5.mp3

UPDATE public_letters 
SET audioUrl = 'https://dearosagyefo.com/audio/letter-' || id || '.mp3'
WHERE audioUrl IS NOT NULL 
  AND audioUrl LIKE '%/audio/letter-%';

-- Verify the update
SELECT COUNT(*) as total_updated, 
       COUNT(CASE WHEN audioUrl LIKE '%letter-_%.mp3' THEN 1 END) as with_correct_format
FROM public_letters 
WHERE audioUrl IS NOT NULL;
