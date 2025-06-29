# Source Bubble Debug Fix

## Problem
The GSChatBubble component was throwing errors when displaying AI message sources:

```
Error: Cannot read property 'content' of undefined
at SourceLessonBubble
```

## Root Cause Analysis

### 1. Missing Database Function
- The AI function was calling `search_lesson_content_rpc` which didn't exist
- The function `search_lesson_content` existed but didn't return `lesson_url_id` needed for grouping sources
- Created new function `search_all_lesson_content` that returns the required fields

### 2. Data Structure Mismatch
- The GSChatBubble component expected a `sources` property with lesson URLs grouped by `lesson_url_id`
- The actual data from the AI function had a different structure
- The `chunk_details` from the AI response didn't include lesson URL information

### 3. Undefined Content Access
- The SourceLessonBubble component was trying to access `mostRelevantChunk.content` without checking if the chunk existed
- When no chunks were available, this caused the error

## Fixes Applied

### 1. Database Function ✅
**File:** `supabase/migrations/011_add_search_all_lesson_content_rpc.sql`
- Applied migration to create `search_all_lesson_content` function
- Function returns: `id`, `content`, `lesson_url_id`, `lesson_id`, `similarity`

### 2. AI Function Update ✅
**File:** `supabase/functions/ai-chat-with-storage/index.ts`
- Changed from `search_lesson_content` to `search_all_lesson_content`
- Updated parameters: `p_lesson_id` → `p_lesson_ids` (array)
- Now returns lesson_url_id in chunk_details

### 3. Store Data Transform ✅
**File:** `store/ai-store.ts`
- Updated data fetching to use lesson_url_ids directly from chunk_details
- Simplified query to fetch lesson_urls by IDs instead of complex join
- Proper source object creation with all required fields

### 4. Component Safety ✅
**File:** `components/ui/GSChatBubble.tsx`
- Added null checks for `lessonUrl.chunks`
- Added null checks for `mostRelevantChunk`
- Added null checks for `mostRelevantChunk.content`
- Returns null gracefully when data is missing

## Data Flow After Fix

1. **User sends message** → AI function
2. **AI function** calls `search_all_lesson_content` → gets chunks with `lesson_url_id`
3. **Store** fetches lesson URL details using `lesson_url_id`
4. **Store** creates proper Source objects grouped by lesson URL
5. **GSChatBubble** displays sources as separate bubdles with safety checks

## Expected Behavior

- ✅ AI messages show "See sources (#)" when sources are available
- ✅ Clicking shows separate bubbles for each unique lesson URL
- ✅ Each bubble shows title, relevance %, and expandable content
- ✅ No more crashes when chunks are undefined
- ✅ Graceful handling of missing data

## Testing Steps

1. Send an AI message that should have sources
2. Verify "See sources" appears and shows count
3. Click to expand sources
4. Verify each lesson URL appears as separate bubble
5. Verify content preview shows first 2 lines
6. Test "See more" expansion
7. Verify no console errors 