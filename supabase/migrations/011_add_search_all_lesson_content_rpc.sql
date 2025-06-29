-- Create RPC function for searching lesson content across all lessons or filtered by lesson IDs
CREATE OR REPLACE FUNCTION public.search_all_lesson_content(
  query_embedding vector,
  p_lesson_ids uuid[] DEFAULT NULL,
  match_count integer DEFAULT 3
)
RETURNS TABLE(
  id uuid,
  content text,
  lesson_url_id uuid,
  lesson_id uuid,
  similarity double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.id,
    uc.content,
    uc.lesson_url_id,
    lu.lesson_id,
    1 - (uc.embedding <=> query_embedding) as similarity
  FROM url_chunks uc
  JOIN lesson_urls lu ON uc.lesson_url_id = lu.id
  WHERE 
    uc.embedding IS NOT NULL
    AND (p_lesson_ids IS NULL OR lu.lesson_id = ANY(p_lesson_ids))
  ORDER BY uc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.search_all_lesson_content TO anon;
GRANT EXECUTE ON FUNCTION public.search_all_lesson_content TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_all_lesson_content TO service_role; 