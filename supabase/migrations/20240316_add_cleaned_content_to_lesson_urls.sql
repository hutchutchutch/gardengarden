-- Add cleaned_content column to lesson_urls table
-- This stores the cleaned version of scraped content with URLs and long strings removed
ALTER TABLE lesson_urls 
ADD COLUMN IF NOT EXISTS cleaned_content TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN lesson_urls.cleaned_content IS 'Cleaned version of scraped content with URLs, emails, and long strings removed for better embedding quality';