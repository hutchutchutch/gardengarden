# URL Scraper Integration for Garden Garden

This document describes the URL scraping functionality integrated into the Garden Garden application for processing educational content from teacher-submitted URLs.

## Overview

The URL scraper allows teachers to add web resources to their lessons. The system automatically:
- Scrapes content from submitted URLs using Firecrawl API
- Chunks the content for efficient processing
- Creates embeddings using OpenAI for semantic search
- Stores everything in Supabase for retrieval during AI-assisted learning

## Database Schema

### Enhanced Tables

1. **lesson_urls** - Stores URL metadata and processing status
   - `processing_progress` (0-100) - Progress indicator for UI
   - `sections` (jsonb) - Extracted content sections
   - `rag_references` - Count of times content was used in RAG
   - `scraped_content` - Full scraped markdown content
   - `metadata` (jsonb) - Additional metadata from scraping

2. **url_chunks** - Stores content chunks with embeddings
   - `embedding` (vector(1536)) - OpenAI embeddings for similarity search
   - Added indexes for efficient vector search

## Edge Functions

### 1. scrape-lesson-url
**Endpoint**: `/functions/v1/scrape-lesson-url`

Scrapes a single URL and processes it into chunks with embeddings.

**Request:**
```json
{
  "url": "https://example.com/article",
  "lesson_id": "uuid",
  "lesson_url_id": "uuid" // Optional, will create new if not provided
}
```

**Response:**
```json
{
  "success": true,
  "lesson_url_id": "uuid",
  "chunks_created": 10,
  "title": "Article Title",
  "sections": 5
}
```

### 2. retrieve-lesson-content
**Endpoint**: `/functions/v1/retrieve-lesson-content`

Retrieves relevant content chunks using vector similarity search.

**Request:**
```json
{
  "query": "What is photosynthesis?",
  "lesson_id": "uuid",
  "limit": 5,
  "threshold": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "content": "Photosynthesis is...",
      "similarity": 0.89,
      "source_url": "https://...",
      "source_title": "Biology 101"
    }
  ],
  "search_type": "vector",
  "total_sources": 3
}
```

### 3. process-lesson-urls
**Endpoint**: `/functions/v1/process-lesson-urls`

Processes multiple URLs for a lesson (batch operation).

**Request:**
```json
{
  "lesson_id": "uuid",
  "urls": [
    {
      "url": "https://example1.com",
      "title": "Optional Title"
    },
    {
      "url": "https://example2.com"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "lesson_id": "uuid",
  "summary": {
    "total_urls": 2,
    "successful": 2,
    "failed": 0,
    "total_chunks": 25
  },
  "results": [...],
  "errors": []
}
```

## Frontend Integration

In `teacher-lessons.tsx`, when creating a lesson:

```typescript
// Example integration for the create lesson modal
const handleAddUrls = async (urls: string[]) => {
  const response = await fetch('/functions/v1/process-lesson-urls', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lesson_id: currentLesson.id,
      urls: urls.map(url => ({ url }))
    })
  });
  
  const result = await response.json();
  // Update UI based on result
};
```

## Security

- All edge functions require authentication (JWT verification)
- RLS policies ensure:
  - Teachers can only manage URLs for their own lessons
  - Students can only view URLs from lessons they're enrolled in
- API keys are stored securely in Supabase environment variables

## Environment Variables Required

- `FIRECRAWL_API_KEY` - For web scraping
- `OPENAI_API_KEY` - For embeddings
- `SUPABASE_URL` - Automatically provided
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically provided

## Performance Considerations

- Chunks are limited to 1500 characters for optimal embedding quality
- Vector indexes use IVFFlat for efficient similarity search
- Processing is asynchronous to avoid blocking the UI
- Progress updates are sent to the database for real-time UI updates

## Error Handling

- Failed URLs are marked with `processing_status: 'failed'`
- Error messages are stored for debugging
- The system gracefully handles partial failures in batch operations
- Fallback to text search if vector search fails

## Usage Workflow

1. Teacher creates a lesson and adds URLs
2. System processes URLs asynchronously
3. Progress is shown in the UI via `processing_progress`
4. Once complete, content is available for AI assistance
5. When students ask questions, relevant content is retrieved
6. Retrieved content is used to provide contextual answers 