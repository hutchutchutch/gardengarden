# AI Chat with Sources Integration

This document describes the AI chat functionality that integrates OpenAI for responses and includes relevant sources from lesson content.

## Overview

The AI chat system provides students with an intelligent assistant that:
- Answers questions about plant care using OpenAI
- Retrieves relevant content from lesson materials
- Displays sources with expandable UI for transparency
- Maintains conversation context across messages

## Architecture

### Edge Function: ai-chat-with-sources
**Endpoint**: `/functions/v1/ai-chat-with-sources`

Processes chat messages using OpenAI and retrieves relevant lesson content.

**Request:**
```json
{
  "message": "How often should I water my tomato plant?",
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
  "sources": [
    {
      "url": "https://example.com/tomato-care",
      "title": "Complete Guide to Tomato Care",
      "snippet": "Watering frequency depends on...",
      "similarity": 0.89
    }
  ],
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
2. **Message sent to store** → Includes lesson_id and plant_id
3. **Edge function called** → ai-chat-with-sources
4. **Content retrieval** → Calls retrieve-lesson-content internally
5. **OpenAI processing** → GPT-4 with context from sources
6. **Response returned** → Message with sources array
7. **UI updates** → GSChatBubble displays with expandable sources

## Source Display

Sources are displayed with:
- **Title** - The document/URL title
- **Snippet** - First 200 characters of relevant content
- **Similarity** - Percentage relevance (0-100%)
- **External link icon** - Click to open source URL

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
// In AIChat component
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

- Vector search limited to top 5 results
- Similarity threshold of 0.7
- Response limited to 500 tokens
- Conversation history limited to last 5 messages

## Error Handling

- Falls back to generic response on API failure
- Continues without sources if retrieval fails
- User-friendly error messages
- Automatic retry not implemented (to avoid cost overruns)

## Future Enhancements

1. **Streaming responses** - Show AI response as it's generated
2. **Image analysis** - Process plant photos with GPT-4V
3. **Voice input** - Speech-to-text for questions
4. **Cached responses** - Store common Q&A pairs
5. **Multi-language** - Support for different languages 