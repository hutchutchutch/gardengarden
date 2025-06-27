# AI Chat with Storage Integration

This document describes the AI chat functionality that integrates OpenAI for responses, includes relevant sources from lesson content, and provides persistent conversation storage.

## Overview

The AI chat system provides students with an intelligent assistant that:
- Answers questions about plant care using OpenAI
- Retrieves relevant content from lesson materials
- Stores conversation history in the database
- Tracks chunk usage and message relationships
- Maintains conversation context across messages

## Architecture

### Edge Function: ai-chat-with-storage
**Endpoint**: `/functions/v1/ai-chat-with-storage`

Processes chat messages using OpenAI, retrieves relevant lesson content, and persists both student and AI messages to the database.

**Request:**
```json
{
  "message": "How often should I water my tomato plant?",
  "thread_id": "uuid",
  "lesson_id": "uuid",
  "plant_id": "uuid",
  "conversation_history": [
    { "role": "user", "content": "Previous message..." },
    { "role": "assistant", "content": "Previous response..." }
  ],
  "include_sources": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tomato plants typically need watering every 2-3 days...",
  "relevant_chunks": ["chunk_uuid_1", "chunk_uuid_2"],
  "student_message_id": "message_uuid_1",
  "ai_message_id": "message_uuid_2",
  "usage": {
    "prompt_tokens": 250,
    "completion_tokens": 150,
    "total_tokens": 400
  }
}
```

## UI Components

### Enhanced GSChatBubble

The chat bubble component now supports:
- Expandable sources section
- Click-to-open source URLs
- Similarity scores for transparency
- Different styles for AI, teacher, and student messages

```typescript
<GSChatBubble
  type="ai"
  message="Here's my advice..."
  timestamp="2024-01-20T10:30:00Z"
  showSources={true}
  sources={[
    {
      url: "https://...",
      title: "Source Title",
      snippet: "Relevant excerpt...",
      similarity: 0.85
    }
  ]}
/>
```

## Integration Flow

1. **User sends message** → AIChat component
2. **Message sent to store** → Includes thread_id, lesson_id and plant_id
3. **Edge function called** → ai-chat-with-storage
4. **Content retrieval** → Direct vector search using embeddings
5. **OpenAI processing** → GPT-4 with context from relevant chunks
6. **Message persistence** → Both student and AI messages saved to database
7. **Response returned** → Message with chunk IDs and message IDs
8. **UI updates** → GSChatBubble displays message

## Data Storage

The function automatically stores:
- **Student message** - Saved with relevant chunk IDs for context
- **AI response** - Saved with same chunk references
- **Thread updates** - last_message_at timestamp updated
- **Usage tracking** - API usage logged with user attribution

## Context Enhancement

The AI receives:
- Current plant information (health, stage, days since planting)
- Relevant lesson content chunks
- Last 5 conversation messages
- System prompt for gardening expertise

## Security

- JWT authentication required
- User can only access their plant/lesson data
- API usage tracked for monitoring
- Cost estimation logged

## Usage Example

```typescript
// In AIChat component - store handles thread_id internally
const handleSend = async () => {
  await sendMessage(
    message,           // User's question
    imageUri,          // Optional photo
    'ai',             // Mode
    lessonId,         // Current lesson
    plantId           // Current plant
  );
};
```

## Performance

- Vector search limited to top 3 relevant chunks
- Direct embedding generation (no external API calls for retrieval)
- Response limited to 500 tokens
- Conversation history limited to last 5 messages
- Automatic message persistence with chunk tracking

## Error Handling

- Falls back to generic response on API failure
- Continues without context if vector search fails
- User-friendly error messages
- Failed messages still saved to database for teacher review
- Automatic retry not implemented (to avoid cost overruns)

## Future Enhancements

1. **Streaming responses** - Show AI response as it's generated
2. **Image analysis** - Process plant photos with GPT-4V
3. **Voice input** - Speech-to-text for questions
4. **Enhanced context** - Use conversation history for better chunk retrieval
5. **Multi-language** - Support for different languages 