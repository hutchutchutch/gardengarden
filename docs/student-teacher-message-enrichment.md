# Student-to-Teacher Message Enrichment

## Overview

This feature enriches student messages sent to teachers with relevant lesson content using semantic similarity search. When a student sends a message, the system automatically finds the top 3 most relevant content chunks from lesson materials and includes them as context.

## Components

### 1. Edge Function: `student-chat-with-teacher`

**Location**: `/supabase/functions/student-chat-with-teacher/index.ts`

This edge function:
- Accepts a student's message and creates an embedding using OpenAI's `text-embedding-3-small` model
- Performs a vector similarity search against the `url_chunks` table to find relevant content
- Prioritizes content from the student's active lessons
- Returns the top 3 most relevant chunks with their lesson context

**Request Format**:
```typescript
{
  message: string;          // The student's message
  student_id: string;       // Student's UUID
  thread_id?: string;       // Optional thread ID for conversations
  create_message?: boolean; // Whether to store the message (default: true)
}
```

**Response Format**:
```typescript
{
  success: boolean;
  message_id?: string;      // ID of created message (if create_message=true)
  relevant_chunks: [{
    chunk_id: string;
    content: string;
    lesson_url_id: string;
    lesson_id: string;
    similarity: number;     // 0-1 similarity score
  }];
  distinct_lesson_url_ids: string[]; // Unique lesson URLs referenced
}
```

### 2. Database Function: `search_all_lesson_content`

**Location**: Migration `011_add_search_all_lesson_content_rpc.sql`

This PostgreSQL function:
- Performs vector similarity search using the `<=>` operator (cosine distance)
- Can filter by specific lesson IDs or search across all content
- Returns chunks with similarity scores

**Parameters**:
- `query_embedding`: vector - The embedding to search for
- `p_lesson_ids`: uuid[] - Optional array of lesson IDs to filter by
- `match_count`: integer - Number of results to return (default: 3)

### 3. Frontend Service: `studentTeacherMessageService`

**Location**: `/services/student-teacher-message-service.ts`

Provides methods for:
- `sendMessageWithContext()`: Send a message and get relevant content
- `formatRelevantContext()`: Format chunks for display
- `getLessonUrlInfo()`: Get detailed information about referenced lessons

## Usage Example

```typescript
import { studentTeacherMessageService } from '@/services/student-teacher-message-service';

// Send a message with context enrichment
const result = await studentTeacherMessageService.sendMessageWithContext(
  "My tomato plant leaves are turning yellow. What should I do?",
  studentId,
  threadId
);

if (result.success) {
  // Display relevant context to the teacher
  const context = studentTeacherMessageService.formatRelevantContext(
    result.relevant_chunks
  );
  
  // Get lesson information
  const lessonInfo = await studentTeacherMessageService.getLessonUrlInfo(
    result.distinct_lesson_url_ids
  );
}
```

## How It Works

1. **Student sends message**: When a student messages their teacher, the frontend calls the service
2. **Create embedding**: The edge function creates a vector embedding of the message using OpenAI
3. **Find active lessons**: The system identifies the student's currently active lessons
4. **Vector search**: Performs similarity search against lesson content chunks, prioritizing active lessons
5. **Return results**: Returns the top 3 most relevant chunks with their source information
6. **Store message**: Optionally stores the message with references to relevant chunks

## Benefits

- **Context-aware**: Teachers see relevant lesson material alongside student questions
- **Efficient**: Uses vector embeddings for fast, semantic similarity search
- **Filtered**: Prioritizes content from the student's active lessons
- **Traceable**: Maintains references to source materials

## Implementation Notes

- The `embedding` column in `url_chunks` uses Supabase's vector type for efficient similarity search
- Similarity scores range from 0 (no similarity) to 1 (perfect match)
- The system gracefully handles cases where no active lessons are found
- Chunks are limited to prevent overwhelming the teacher with too much context 