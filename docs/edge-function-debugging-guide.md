# 🔧 Edge Function Debugging Guide: Non-2xx Status Code Errors

## 🆕 Latest Error Update: URL Accessibility Timeout

### Current Error Pattern (Updated):
```
LOG  ⏱️ [STEP 2] Edge function call completed in 5700ms
ERROR  ❌ [STEP 2 FAILED] Edge function error: [FunctionsHttpError: Edge Function returned a non-2xx status code]
```

### Supabase Logs Analysis:
```json
{
  "event_message": "[DETAILED ERROR] Function failed after 5140ms: {
    message: \"URL not accessible: Signal timed out.\",
    stack: \"Error: URL not accessible: Signal timed out.\\n\" +
      \"    at Server.<anonymous> (file:///tmp/user_fn_nxckuxelyleuexcsdczs_73fafabf-b490-45e0-bf3f-05391f7ad012_4/source/index.ts:255:13)\",
    timestamp: \"2025-06-27T18:25:28.232Z\"
  }",
  "level": "error",
  "served_by": "supabase-edge-runtime-1.67.4"
}
```

### Key Finding:
The function is failing at a URL accessibility check (line 255) with a 5-second timeout. The error occurs BEFORE reaching Firecrawl API, indicating the edge function is performing a pre-flight check that's timing out.

## 🚨 Immediate Action Items

### 1. Remove or Reduce URL Pre-flight Check Timeout
The edge function appears to be testing URL accessibility with a 5-second timeout. This should be reduced or made optional:

```typescript
// PROBLEMATIC CODE (likely at line 255):
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout too short

// FIXED CODE:
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 2000); // Reduce to 2s
// Or skip the check entirely for known slow domains
```

### 2. Add Domain-Specific Handling
```typescript
// Add this early in the function
const SLOW_DOMAINS = ['perenual.com', 'plants.usda.gov'];
const domain = new URL(url).hostname;
const isSlowDomain = SLOW_DOMAINS.some(slow => domain.includes(slow));

if (isSlowDomain) {
  console.log('[DEBUG] Skipping URL pre-check for known slow domain:', domain);
  // Skip the accessibility check
} else {
  // Perform the check with shorter timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    clearTimeout(timeoutId);
  } catch (error) {
    console.log('[WARNING] URL pre-check failed, continuing anyway:', error.message);
    // Don't throw - let Firecrawl handle it
  }
}
```

### 3. Enhanced Debugging for Current Issue
Add these debug statements to the edge function:

```typescript
console.log('[DEBUG] Function started at:', new Date().toISOString());
console.log('[DEBUG] Processing URL:', url);
console.log('[DEBUG] URL domain:', new URL(url).hostname);

// Time each operation
const timings = {
  start: Date.now(),
  preCheck: 0,
  firecrawl: 0,
  embeddings: 0,
  database: 0
};

// Before URL check
console.log('[TIMING] Starting URL pre-check...');
const preCheckStart = Date.now();

// After URL check (or catch)
timings.preCheck = Date.now() - preCheckStart;
console.log('[TIMING] URL pre-check took:', timings.preCheck, 'ms');

// At the end
console.log('[TIMING] Complete breakdown:', {
  ...timings,
  total: Date.now() - timings.start
});
```

## 🚨 Error Pattern Analysis

### Observed Error:
```
LOG  ⏱️ [STEP 2] Edge function call completed in 31434ms
ERROR  ❌ [STEP 2 FAILED] Edge function error: [FunctionsHttpError: Edge Function returned a non-2xx status code]
```

### Key Indicators:
- **31+ second execution time** - Suggests timeout or heavy processing
- **No specific error details** - Function crashed before returning meaningful error
- **Non-2xx status code** - Function returned 400, 500, or other error status

## 🔍 Debugging Process

### Step 1: Check Edge Function Logs

```bash
# Get recent logs for the specific function
supabase functions logs scrape-lesson-url --follow
```

**What to look for:**
- Memory limits exceeded
- API timeout errors
- Database connection issues
- Missing environment variables

### Step 2: Test Function Locally

```bash
# Start local development
supabase start
supabase functions serve scrape-lesson-url --env-file supabase/.env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/scrape-lesson-url \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://perenual.com/plant-database-search-guide/species/1055/guide",
    "lesson_id": "11112222-3333-4444-5555-666677778888"
  }'
```

### Step 3: Enable Comprehensive Console Logging

Add this to the edge function for detailed debugging:

```typescript
// At the start of the function
console.log('[DEBUG] Function started with environment check:', {
  hasFirecrawlKey: !!Deno.env.get('FIRECRAWL_API_KEY'),
  hasOpenAIKey: !!Deno.env.get('OPENAI_API_KEY'),
  hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
  hasSupabaseKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
});

// Before each major operation
console.log('[DEBUG] About to call Firecrawl API...');
console.log('[DEBUG] About to create embeddings...');
console.log('[DEBUG] About to store in database...');
```

## 🛠️ Common Root Causes & Solutions

### 1. 🔑 RLS (Row Level Security) Issues

**Symptoms:**
- Function works locally but fails in production
- No specific database error in logs
- Quick failure (< 5 seconds)

**Diagnosis:**
```sql
-- Check RLS policies for lesson_urls table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'lesson_urls';

-- Check RLS policies for url_chunks table  
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'url_chunks';
```

**Solution:**
```sql
-- Temporarily disable RLS for debugging
ALTER TABLE lesson_urls DISABLE ROW LEVEL SECURITY;
ALTER TABLE url_chunks DISABLE ROW LEVEL SECURITY;

-- Or create service role policies
CREATE POLICY "service_role_all_lesson_urls" ON lesson_urls
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_url_chunks" ON url_chunks  
FOR ALL USING (true) WITH CHECK (true);
```

### 2. ⏱️ Timeout Issues (Most Likely for 31s execution)

**Symptoms:**
- Execution time > 30 seconds
- Large content being processed
- Multiple API calls timing out

**Diagnosis:**
```typescript
// Add timing logs around each operation
const startTime = Date.now();
// ... operation
console.log(`[TIMING] Operation took: ${Date.now() - startTime}ms`);
```

**Solutions:**

#### A. Increase Function Timeout
```bash
# In your edge function deployment
supabase functions deploy scrape-lesson-url --no-verify-jwt
```

#### B. Optimize Processing
```typescript
// Process chunks in batches instead of sequentially
const BATCH_SIZE = 5;
for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
  const batch = chunks.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(async (chunk, batchIndex) => {
    // Process chunk
  }));
}
```

#### C. Implement Circuit Breaker
```typescript
async function createEmbeddingWithRetry(text: string, maxRetries = 3): Promise<number[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        signal: controller.signal,
        // ... other options
      });
      
      clearTimeout(timeoutId);
      return await response.json();
    } catch (error) {
      console.log(`[RETRY] Attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }
}
```

### 3. 🔐 API Key Issues

**Symptoms:**
- 401 Unauthorized errors
- Function fails quickly
- "API key not found" messages

**Diagnosis:**
```typescript
// Test API keys in function
console.log('[DEBUG] Testing API connectivity...');

// Test Firecrawl
try {
  const testResponse = await fetch('https://api.firecrawl.dev/v0/crawl', {
    headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}` }
  });
  console.log('[DEBUG] Firecrawl API status:', testResponse.status);
} catch (error) {
  console.log('[DEBUG] Firecrawl API error:', error);
}

// Test OpenAI
try {
  const testResponse = await fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
  });
  console.log('[DEBUG] OpenAI API status:', testResponse.status);
} catch (error) {
  console.log('[DEBUG] OpenAI API error:', error);
}
```

**Solution:**
```bash
# Check environment variables in Supabase dashboard
# Functions > Settings > Environment Variables

# Required variables:
FIRECRAWL_API_KEY=fc-xxxxx
OPENAI_API_KEY=sk-xxxxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

### 4. 🌐 Network/URL Issues

**Symptoms:**
- Specific URLs failing
- "Failed to fetch" errors
- DNS resolution errors

**Diagnosis:**
```typescript
// Test URL accessibility
console.log('[DEBUG] Testing URL accessibility:', url);
try {
  const response = await fetch(url, { 
    method: 'HEAD',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GardenGuru/1.0)' }
  });
  console.log('[DEBUG] URL accessible:', response.status, response.headers);
} catch (error) {
  console.log('[DEBUG] URL not accessible:', error);
}
```

**Solution:**
```typescript
// Add user agent and error handling
const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url,
    formats: ['markdown'],
    waitFor: 5000,
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; GardenGuru/1.0)'
    }
  }),
});
```

### 5. 💾 Memory/Resource Issues

**Symptoms:**
- Large content failing
- Function crashes on specific URLs
- "out of memory" errors

**Diagnosis:**
```typescript
// Monitor memory usage
console.log('[DEBUG] Memory usage:', {
  contentLength: markdown?.length,
  chunksCount: chunks?.length,
  memoryUsage: performance.memory ? {
    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
  } : 'not available'
});
```

**Solution:**
```typescript
// Limit content size
const MAX_CONTENT_SIZE = 500000; // 500KB
if (markdown.length > MAX_CONTENT_SIZE) {
  console.log('[WARNING] Content too large, truncating...');
  markdown = markdown.substring(0, MAX_CONTENT_SIZE) + '\n\n[Content truncated...]';
}

// Limit chunk count
const MAX_CHUNKS = 50;
if (chunks.length > MAX_CHUNKS) {
  console.log('[WARNING] Too many chunks, limiting to', MAX_CHUNKS);
  chunks = chunks.slice(0, MAX_CHUNKS);
}
```

## 🔧 Step-by-Step Debugging Protocol

### For the Specific Error (31s timeout):

1. **Check Firecrawl API Status**
   ```bash
   curl -X POST https://api.firecrawl.dev/v1/scrape \
     -H "Authorization: Bearer YOUR_FIRECRAWL_KEY" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://perenual.com/plant-database-search-guide/species/1055/guide"}'
   ```

2. **Test URL Manually**
   - Open URL in browser
   - Check if it loads quickly
   - Look for JavaScript-heavy content
   - Check content size

3. **Check Edge Function Logs**
   ```bash
   supabase functions logs scrape-lesson-url --project-ref YOUR_PROJECT_REF
   ```

4. **Test with Simpler URL**
   - Try with a simple static page first
   - Example: `https://example.com`

5. **Add Progressive Timeouts**
   ```typescript
   // Set shorter timeouts for each operation
   const FIRECRAWL_TIMEOUT = 20000; // 20s
   const EMBEDDING_TIMEOUT = 5000;  // 5s per embedding
   const DB_TIMEOUT = 3000;         // 3s per DB operation
   ```

## 🚀 Quick Fixes for Immediate Resolution

### 1. Temporary Workaround
```typescript
// Add to the beginning of your edge function
if (url.includes('perenual.com')) {
  // This site is known to be slow, use different approach
  return new Response(JSON.stringify({
    success: false,
    error: 'Site temporarily unsupported due to performance issues'
  }), { status: 400 });
}
```

### 2. Enable Detailed Logging
```typescript
// Add comprehensive error catching
try {
  // ... existing code
} catch (error) {
  console.error('[DETAILED ERROR]', {
    message: error.message,
    stack: error.stack,
    url,
    lesson_id,
    timestamp: new Date().toISOString()
  });
  
  return new Response(JSON.stringify({
    success: false,
    error: error.message,
    debug_info: {
      url,
      lesson_id,
      error_type: error.constructor.name
    }
  }), { 
    status: 500,
    headers: corsHeaders 
  });
}
```

### 3. Database Connection Test
```typescript
// Test database connectivity early
try {
  const { data, error } = await supabase
    .from('lessons')
    .select('id')
    .eq('id', lesson_id)
    .single();
    
  if (error) {
    console.error('[DB TEST] Database connection failed:', error);
    throw new Error(`Database error: ${error.message}`);
  }
  
  console.log('[DB TEST] Database connection successful');
} catch (dbError) {
  console.error('[DB TEST] Critical database error:', dbError);
  throw dbError;
}
```

## 📊 Monitoring & Prevention

### 1. Add Performance Metrics
```typescript
const metrics = {
  startTime: Date.now(),
  firecrawlTime: 0,
  embeddingTime: 0,
  dbTime: 0,
  totalChunks: 0,
  contentSize: 0
};

// At the end
console.log('[METRICS]', {
  ...metrics,
  totalTime: Date.now() - metrics.startTime
});
```

### 2. Implement Health Checks
```typescript
// Add a health check endpoint
if (req.url.includes('/health')) {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: {
      hasFirecrawlKey: !!FIRECRAWL_API_KEY,
      hasOpenAIKey: !!OPENAI_API_KEY,
      hasSupabaseAccess: !!supabaseUrl
    }
  }));
}
```

### 3. Content Validation
```typescript
function validateUrl(url: string): string | null {
  // Known problematic domains
  const blockedDomains = ['slow-site.com', 'heavy-content.org'];
  const domain = new URL(url).hostname;
  
  if (blockedDomains.some(blocked => domain.includes(blocked))) {
    return `Domain ${domain} is not supported due to performance issues`;
  }
  
  return null;
}
```

## 🎯 Action Items for Current Issue

Based on the 31-second timeout with perenual.com:

1. **Immediate**: Test the Firecrawl API directly with this URL
2. **Short-term**: Add timeout controls and retry logic  
3. **Long-term**: Implement async processing with job queues

The most likely cause is that perenual.com is a slow-loading, JavaScript-heavy site that's timing out during the Firecrawl scraping process. 

## 📝 Summary: Resolving the perenual.com Timeout

### Root Cause Analysis
The error logs show the edge function is failing at a URL accessibility pre-check (line 255) with a 5-second timeout. This occurs BEFORE the Firecrawl API call, meaning the function never gets to the actual scraping step.

### Recommended Solution Path

1. **Immediate Fix** (Deploy Now):
   - Remove or bypass the URL pre-flight check
   - Let Firecrawl handle URL validation
   - This will likely resolve the immediate issue

2. **Short-term Improvements** (This Week):
   - Add domain-specific handling for slow sites
   - Implement better timeout strategies
   - Add comprehensive error messages for users

3. **Long-term Architecture** (Next Sprint):
   - Move to async processing with job queues
   - Implement webhook callbacks for long-running scrapes
   - Add a status endpoint for checking progress

### Quick Deploy Script
```bash
# 1. Update your edge function to skip URL pre-check
# 2. Deploy with:
supabase functions deploy scrape-lesson-url \
  --project-ref nxckuxelyleuexcsdczs \
  --no-verify-jwt

# 3. Test immediately:
curl -X POST https://nxckuxelyleuexcsdczs.supabase.co/functions/v1/scrape-lesson-url \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "lesson_id": "test-123"
  }'

# 4. If successful, test with problematic URL:
curl -X POST https://nxckuxelyleuexcsdczs.supabase.co/functions/v1/scrape-lesson-url \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://perenual.com/plant-database-search-guide/species/1055/guide",
    "lesson_id": "11112222-3333-4444-5555-666677778888"
  }'
```

### User Experience Improvements
While fixing the technical issue, also improve the user experience:

```typescript
// In teacher-lessons.tsx handleAddResource
} catch (error) {
  console.error('❌ [STEP 2 FAILED] Edge function error:', error);
  
  // User-friendly error handling
  const errorMessage = error.message.toLowerCase();
  let userMessage = 'Failed to add resource. Please try again.';
  
  if (errorMessage.includes('timeout')) {
    userMessage = 'This website is taking too long to respond. Try a different resource or wait a moment and try again.';
  } else if (errorMessage.includes('not found')) {
    userMessage = 'Could not access this URL. Please check if the link is correct.';
  }
  
  Alert.alert('Resource Error', userMessage);
  return;
}
```

### Monitoring Dashboard
Set up alerts for edge function failures:

```sql
-- Query to monitor edge function errors
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as error_count,
  ARRAY_AGG(DISTINCT metadata->>'url') as failed_urls
FROM edge_logs
WHERE 
  function_id = '73fafabf-b490-45e0-bf3f-05391f7ad012'
  AND level = 'error'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

---

The debugging guide is now comprehensive and actionable. The key insight is that the function is failing at a preliminary URL check, not at the Firecrawl API call. Removing or reducing this check should resolve the immediate issue.