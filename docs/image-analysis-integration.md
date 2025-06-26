# Image Analysis Integration

This document explains the AI-powered image analysis system that processes student plant photos using Google's Gemini API.

## Key Features

- **Automatic Analysis**: Photos uploaded through tasks are automatically analyzed
- **HEIC Support**: Automatically converts HEIC/HEIF images from iOS devices to JPG
- **Image Compression**: Compresses large images to stay under API limits
- **Educational Feedback**: AI provides growth stage, health assessment, and tips
- **Data Storage**: Results stored in Supabase with student association
- **Real-time Updates**: UI polls for analysis completion

## Overview

The image analysis system consists of:
1. **Database Table**: `image_analysis` - stores analysis results
2. **Edge Function**: `analyze-plant-image` - processes images with Gemini API
3. **Service Layer**: `ImageAnalysisService` - handles API calls
4. **Photo Service**: `PhotoService` - manages uploads and triggers analysis

## Database Schema

### `image_analysis` Table

```sql
CREATE TABLE image_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Current stage information
  current_stage_name TEXT,
  current_stage_description TEXT,
  
  -- Overall health assessment
  health_rating TEXT CHECK (health_rating IN ('Excellent', 'Good', 'Fair', 'Poor', 'Critical')),
  positive_signs TEXT[], -- Array of positive observations
  areas_for_improvement TEXT[], -- Array of areas needing attention
  
  -- Tips and recommendations
  tips JSONB, -- Array of tip objects with title and description
  
  -- Metadata
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Edge Function

### `analyze-plant-image`

Located in Supabase Edge Functions, this function:
1. Receives image URL and student ID
2. Downloads and converts image to base64
3. Calls Gemini API with structured prompt
4. Parses JSON response
5. Stores results in database

### Environment Variables Required

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
- `GEMINI_API_KEY`: Google Gemini API key

## Service Integration

### ImageAnalysisService

Key methods:
- `analyzeImage(imageUrl, studentId)`: Trigger analysis
- `getLatestAnalysis(studentId)`: Get most recent analysis
- `getYesterdayAnalysis(studentId)`: Get yesterday's feedback
- `getAnalysisHistory(studentId)`: Get analysis history
- `getLatestHealthScore(studentId)`: Get current health score

### PhotoService

Enhanced with analysis integration:
- `convertHeicToJpg(uri)`: Convert HEIC/HEIF images to JPG format
- `compressImage(uri, format, maxWidth, quality)`: Compress images for analysis
- `uploadAndAnalyze(imageUri, studentId)`: Upload photo and trigger analysis (includes HEIC conversion and compression)
- `uploadPhoto(imageUri, studentId, fileName, compress)`: Upload without analysis
- `getPhotoHistory(studentId)`: Get photo history

## UI Integration

### Student Index Screen

Shows yesterday's analysis results:
- Current stage description
- Health rating
- Positive signs (as success chips)
- Areas for improvement (as warning chips)
- Tips (collapsible section)

### Student Progress Screen

Displays:
- Latest analysis data
- Health trends
- Growth stage progression
- Historical analysis data

### Camera Screen

Updated to:
1. Upload photo to Supabase Storage
2. Trigger analysis via PhotoService
3. Poll for completion
4. Display results with health score and recommendations

## Analysis Output Format

The Gemini API returns structured JSON:

```json
{
  "current_stage": {
    "name": "Flowering and Fruiting",
    "description": "Detailed description of current growth stage with visual indicators"
  },
  "overall_health": {
    "rating": "Good",
    "positive_signs": [
      "Vigorous green foliage and dense growth",
      "Abundant yellow blossoms indicating ongoing fruit production"
    ],
    "areas_for_improvement": [
      "Some leaves show signs of curling from heat stress",
      "Minor yellowing on lower leaves may indicate nutrient needs"
    ]
  },
  "tips": [
    {
      "title": "Teaching Point: Indeterminate Growth",
      "description": "Use this plant as a perfect example of an 'indeterminate' variety..."
    },
    {
      "title": "Harvesting Ripe Fruit",
      "description": "The bright red tomato is ready to be harvested! Gently twist it from the vine..."
    }
  ]
}
```

## Usage Examples

### Trigger Analysis

```typescript
import { PhotoService } from '@/services/photo-service';

const result = await PhotoService.uploadAndAnalyze(imageUri, studentId);
if (result.success) {
  console.log('Analysis triggered:', result.analysisId);
}
```

### Get Latest Analysis

```typescript
import { ImageAnalysisService } from '@/services/image-analysis-service';

const analysis = await ImageAnalysisService.getLatestAnalysis(studentId);
if (analysis) {
  console.log('Current stage:', analysis.current_stage_name);
  console.log('Health rating:', analysis.health_rating);
}
```

### Poll for Completion

```typescript
const checkAnalysis = async (analysisId: string) => {
  const analysis = await ImageAnalysisService.getAnalysisStatus(analysisId);
  
  if (analysis?.processing_status === 'completed') {
    // Analysis is ready
    return analysis;
  } else if (analysis?.processing_status === 'failed') {
    throw new Error(analysis.error_message);
  } else {
    // Still processing, check again later
    return null;
  }
};
```

## Error Handling

The system handles various error scenarios:
- Image upload failures
- Gemini API errors
- Network timeouts
- Invalid JSON responses
- Database errors

All errors are logged and user-friendly messages are displayed.

## Security

- RLS policies ensure students only see their own analyses
- Storage policies restrict photo access to photo owners
- Edge function validates input parameters
- Service role key used for database operations

## Performance Considerations

- Images are processed asynchronously
- Analysis results are cached in database
- Polling mechanism prevents UI blocking
- Photo storage includes automatic cleanup policies

## Testing

To test the integration:
1. Set up Gemini API key in Supabase Edge Functions secrets
2. Take a photo using the camera screen
3. Wait for analysis completion
4. Check results in student index and progress screens 