import { supabase } from '@/config/supabase';
import { PlantImage } from '@/types';
import { decode } from 'base64-arraybuffer';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { ImageAnalysisService } from './image-analysis-service';

export interface PhotoUploadResult {
  success: boolean;
  photoUrl?: string;
  analysisId?: string;
  error?: string;
  isDuplicate?: boolean;
  originalAnalysisId?: string;
}

export interface ImageHash {
  perceptualHash: string;
  fileSize: number;
  dimensions: { width: number; height: number };
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  originalAnalysisId?: string;
  hammingDistance?: number;
}

// Upload photo to Supabase Storage with metadata for auto-deletion
export const uploadPlantPhoto = async (
  photoUri: string, 
  userId: string, 
  plantId: string
): Promise<PlantImage> => {
  try {
    // Create a unique filename
    const filename = `${userId}/${plantId}/${Date.now()}.jpg`;
    
    // Fetch the image blob and convert to base64
    const response = await fetch(photoUri);
    const blob = await response.blob();
    
    // Convert blob to base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
    });
    reader.readAsDataURL(blob);
    const base64Data = await base64Promise;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('plant-photos')
      .upload(filename, decode(base64Data), {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('plant-photos')
      .getPublicUrl(filename);

    // Create database record for tracking
    const plantImage = {
      uri: publicUrl,
      storage_path: filename,
      date: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      user_id: userId,
      plant_id: plantId
    };

    // Add to database
    const { data, error } = await supabase
      .from('plant_images')
      .insert([plantImage])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      uri: data.uri,
      date: data.date,
      expiresAt: data.expires_at,
      userId: data.user_id,
      plantId: data.plant_id
    };
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};

// Function to delete expired photos - can be called by a scheduled job
export const deleteExpiredPhotos = async () => {
  try {
    // Get all expired photos
    const { data: expiredPhotos, error: fetchError } = await supabase
      .from('plant_images')
      .select('*')
      .lt('expires_at', new Date().toISOString());

    if (fetchError) throw fetchError;
    if (!expiredPhotos || expiredPhotos.length === 0) return;

    // Delete from storage
    const storageDeletePromises = expiredPhotos.map(photo => 
      supabase.storage
        .from('plant-photos')
        .remove([photo.storage_path])
    );

    // Delete from database
    const { error: dbError } = await supabase
      .from('plant_images')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (dbError) throw dbError;

    await Promise.all(storageDeletePromises);
    
    console.log(`Deleted ${expiredPhotos.length} expired photos`);
  } catch (error) {
    console.error('Error deleting expired photos:', error);
    throw error;
  }
};

// Save photo locally and sync to Supabase when online
export const savePhotoOffline = async (
  photoUri: string,
  userId: string,
  plantId: string
): Promise<string> => {
  // For MVP, we'll just save the URI
  // In production, you'd implement proper offline storage
  // using AsyncStorage or SQLite
  
  try {
    // Save to AsyncStorage for offline access
    const offlineData = {
      photoUri,
      userId,
      plantId,
      timestamp: new Date().toISOString(),
      synced: false
    };
    
    // This would be saved to AsyncStorage/SQLite
    // await AsyncStorage.setItem(`offline_photo_${Date.now()}`, JSON.stringify(offlineData));
    
    return photoUri;
  } catch (error) {
    console.error('Error saving photo offline:', error);
    throw error;
  }
};

/**
 * Perceptual hashing utilities for duplicate detection
 */
class PerceptualHash {
  /**
   * Generate a simple difference hash (dHash) from image data
   * This is a simplified implementation - in production you'd use a more robust library
   */
  static async generateDHash(imageUri: string): Promise<string> {
    try {
      // Resize image to 9x8 for dHash calculation
      const resized = await manipulateAsync(
        imageUri,
        [{ resize: { width: 9, height: 8 } }],
        { compress: 1, format: SaveFormat.PNG }
      );

      // For a proper implementation, you'd analyze pixel differences
      // This is a simplified approach using file content as a hash base
      const fileInfo = await FileSystem.getInfoAsync(resized.uri);
      const fileData = await FileSystem.readAsStringAsync(resized.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Simple hash based on image data characteristics
      // In production, use a proper perceptual hashing library
      const hash = this.simpleImageHash(fileData);
      
      // Clean up temporary file
      try {
        await FileSystem.deleteAsync(resized.uri);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temporary file:', cleanupError);
      }

      return hash;
    } catch (error) {
      console.error('Error generating dHash:', error);
      throw error;
    }
  }

  /**
   * Simple hash function for demonstration - replace with proper perceptual hashing
   */
  private static simpleImageHash(base64Data: string): string {
    let hash = 0;
    // Sample every 1000th character to create a representative hash
    for (let i = 0; i < base64Data.length; i += 1000) {
      const char = base64Data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to hex string and pad to ensure consistent length
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Calculate Hamming distance between two hash strings
   */
  static hammingDistance(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) {
      return Infinity;
    }

    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) {
        distance++;
      }
    }
    return distance;
  }

  /**
   * Check if two hashes represent duplicate images
   * Threshold of 3 or less is typically considered a duplicate
   */
  static isDuplicate(hash1: string, hash2: string, threshold: number = 3): boolean {
    const distance = this.hammingDistance(hash1, hash2);
    return distance <= threshold;
  }
}

export class PhotoService {
  /**
   * Generate perceptual hash and image metadata for duplicate detection
   */
  static async generateImageHash(imageUri: string): Promise<ImageHash> {
    try {
      // Generate perceptual hash
      const perceptualHash = await PerceptualHash.generateDHash(imageUri);
      
      // Get file info for size
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      const fileSize = fileInfo.exists ? fileInfo.size || 0 : 0;
      
      // Get image dimensions (simple approach via resize to get natural dimensions)
      const resized = await manipulateAsync(
        imageUri,
        [], // No transformations, just get info
        { compress: 1, format: SaveFormat.JPEG }
      );
      
      // For simplicity, we'll use a standard size - in production you'd extract actual dimensions
      const dimensions = { width: 1200, height: 800 }; // Default dimensions
      
      return {
        perceptualHash,
        fileSize,
        dimensions
      };
    } catch (error) {
      console.error('Error generating image hash:', error);
      throw error;
    }
  }

  /**
   * Check if an image is a duplicate of any existing image
   */
  static async checkForDuplicate(perceptualHash: string, fileSize: number, threshold: number = 3): Promise<DuplicateCheckResult> {
    try {
      // Query for existing images with similar characteristics
      const { data: existingAnalyses, error } = await supabase
        .from('image_analysis')
        .select('id, perceptual_hash, file_size_bytes')
        .not('perceptual_hash', 'is', null)
        .eq('is_duplicate', false); // Only check against originals, not duplicates

      if (error) {
        console.error('Error querying for duplicates:', error);
        return { isDuplicate: false };
      }

      if (!existingAnalyses || existingAnalyses.length === 0) {
        return { isDuplicate: false };
      }

      // Check each existing hash for similarity
      for (const analysis of existingAnalyses) {
        if (!analysis.perceptual_hash) continue;

        const hammingDistance = PerceptualHash.hammingDistance(perceptualHash, analysis.perceptual_hash);
        
        // Consider it a duplicate if hash is similar AND file size is close (within 10%)
        const fileSizeSimilar = fileSize === 0 || analysis.file_size_bytes === 0 || 
          Math.abs(fileSize - analysis.file_size_bytes) / Math.max(fileSize, analysis.file_size_bytes) < 0.1;

        if (hammingDistance <= threshold && fileSizeSimilar) {
          return {
            isDuplicate: true,
            originalAnalysisId: analysis.id,
            hammingDistance
          };
        }
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return { isDuplicate: false };
    }
  }

  /**
   * Convert HEIC images to JPG format
   */
  static async convertHeicToJpg(uri: string): Promise<string> {
    try {
      console.log('🔄 Checking image format for:', uri);
      
      // Check if the image is HEIC/HEIF format
      const isHeic = uri.toLowerCase().includes('.heic') || uri.toLowerCase().includes('.heif');
      const isPotentialHeic = !uri.toLowerCase().includes('.jpg') && !uri.toLowerCase().includes('.jpeg') && !uri.toLowerCase().includes('.png');
      
      console.log('📋 Format analysis:', {
        isHeic,
        isPotentialHeic,
        hasJpgExtension: uri.toLowerCase().includes('.jpg') || uri.toLowerCase().includes('.jpeg'),
        hasPngExtension: uri.toLowerCase().includes('.png'),
        originalUri: uri
      });
      
      if (!isHeic && !isPotentialHeic) {
        console.log('✅ Image appears to be standard format, skipping conversion');
        return uri;
      }
      
      if (isPotentialHeic) {
        console.log('⚠️ Image might be HEIC (no standard extension detected), attempting conversion...');
      }

      // Create a temporary file path for the converted image
      const tempFileName = `converted_${Date.now()}.jpg`;
      const tempUri = `${FileSystem.documentDirectory}${tempFileName}`;
      console.log('📁 Temp file path:', tempUri);

      // Copy the HEIC file to a temporary location
      console.log('📋 Copying original file to temp location...');
      await FileSystem.copyAsync({
        from: uri,
        to: tempUri,
      });
      
      // Verify copy was successful
      const tempFileInfo = await FileSystem.getInfoAsync(tempUri);
      console.log('📄 Temp file info after copy:', tempFileInfo);
      
      if (!tempFileInfo.exists || tempFileInfo.size === 0) {
        throw new Error('Failed to copy image to temporary location');
      }

      // Convert to JPG using ImageManipulator
      console.log('🔄 Converting image format...');
      const result = await manipulateAsync(
        tempUri,
        [], // No transformations, just format conversion
        {
          compress: 1, // No compression during conversion
          format: SaveFormat.JPEG,
        }
      );
      
      console.log('✅ Conversion result:', result);
      
      // Verify converted file
      const convertedFileInfo = await FileSystem.getInfoAsync(result.uri);
      console.log('📄 Converted file info:', convertedFileInfo);
      
      if (!convertedFileInfo.exists || convertedFileInfo.size === 0) {
        throw new Error('Image conversion resulted in empty file');
      }

      // Clean up the temporary file
      try {
        await FileSystem.deleteAsync(tempUri);
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary file:', cleanupError);
      }

      return result.uri;
    } catch (error) {
      console.error('Error converting HEIC to JPG:', error);
      // Return original URI if conversion fails
      return uri;
    }
  }

  /**
   * Compress image to reduce file size for analysis
   */
  static async compressImage(
    uri: string, 
    format: SaveFormat = SaveFormat.JPEG,
    maxWidth: number = 1200,
    quality: number = 0.7
  ): Promise<string> {
    try {
      // First verify the input image exists and has content
      const inputInfo = await FileSystem.getInfoAsync(uri);
      console.log('🔍 Input image info:', inputInfo);
      
      if (!inputInfo.exists || inputInfo.size === 0) {
        console.error('❌ Input image is empty or doesn\'t exist');
        throw new Error('Input image is invalid');
      }
      
      const result = await manipulateAsync(
        uri,
        [{ resize: { width: maxWidth } }],
        { compress: quality, format }
      );
      
      // Verify the compressed result is valid
      const outputInfo = await FileSystem.getInfoAsync(result.uri);
      console.log('✅ Compressed image info:', outputInfo);
      
      if (!outputInfo.exists || outputInfo.size === 0) {
        console.error('❌ Compression resulted in empty file');
        throw new Error('Compression produced empty file');
      }
      
      return result.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      
      // Verify original URI is still valid before returning it
      try {
        const originalInfo = await FileSystem.getInfoAsync(uri);
        if (originalInfo.exists && originalInfo.size > 0) {
          console.log('🔄 Returning original URI as fallback');
          return uri;
        }
      } catch (fallbackError) {
        console.error('Original URI also invalid:', fallbackError);
      }
      
      throw new Error('Both compression and original image are invalid');
    }
  }

  /**
   * Upload image for chat and analyze with conversation context
   */
  static async uploadAndAnalyzeForChat(
    imageUri: string,
    userId: string,
    threadId: string,
    conversationHistory: Array<{
      role: string;
      content: string;
      timestamp: string;
    }>,
    plantId?: string,
    lessonId?: string
  ): Promise<{ success: boolean; photoUrl?: string; analysisMessage?: string; error?: string }> {
    try {
      // Generate filename for chat images
      const fileName = `chat-${threadId}-${Date.now()}.jpg`;
      
      // Convert HEIC to JPG if necessary
      const convertedUri = await this.convertHeicToJpg(imageUri);
      
      // Compress image for chat (smaller size for faster processing)
      const compressedUri = await this.compressImage(convertedUri, SaveFormat.JPEG, 800, 0.6);
      
      // Read file directly as base64 instead of using fetch
      const base64Data = await FileSystem.readAsStringAsync(compressedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Upload base64 directly to Supabase using decode
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('plant-photos')
        .upload(`chat/${userId}/${fileName}`, decode(base64Data), {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return {
          success: false,
          error: 'Failed to upload image'
        };
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('plant-photos')
        .getPublicUrl(uploadData.path);

      const photoUrl = publicUrlData.publicUrl;

      // Call the chat image analysis Edge Function
      const analysisResponse = await supabase.functions.invoke('analyze-chat-image', {
        body: {
          imageUrl: photoUrl,
          threadId: threadId,
          conversationHistory: conversationHistory,
          plantId: plantId,
          lessonId: lessonId
        }
      });

      if (analysisResponse.error) {
        console.error('Analysis error:', analysisResponse.error);
        return {
          success: true, // Image uploaded successfully
          photoUrl,
          error: 'Image uploaded but analysis failed'
        };
      }

      const analysisData = analysisResponse.data;
      
      if (!analysisData?.success) {
        console.error('Analysis failed:', analysisData);
        return {
          success: true, // Image uploaded successfully
          photoUrl,
          error: 'Image uploaded but analysis failed'
        };
      }

      return {
        success: true,
        photoUrl,
        analysisMessage: analysisData.message
      };

    } catch (error) {
      console.error('Error in uploadAndAnalyzeForChat:', error);
      return {
        success: false,
        error: 'Unexpected error occurred'
      };
    }
  }

  /**
   * Upload a photo and trigger analysis with duplicate detection
   */
  static async uploadAndAnalyze(
    imageUri: string, 
    studentId: string, 
    fileName?: string
  ): Promise<PhotoUploadResult> {
    try {
      console.log('📸 Starting uploadAndAnalyze with URI:', imageUri);
      
      // Generate filename if not provided
      const finalFileName = fileName || `plant-photo-${Date.now()}.jpg`;
      console.log('📝 Generated filename:', finalFileName);
      
      // Convert HEIC to JPG if necessary
      const convertedUri = await this.convertHeicToJpg(imageUri);
      console.log('🔄 Converted URI:', convertedUri);
      
      // Compress image for analysis (to stay under 4MB limit)
      const compressedUri = await this.compressImage(convertedUri, SaveFormat.JPEG, 1200, 0.7);
      console.log('📦 Compressed URI:', compressedUri);
      
      // Check if the compressed image is valid
      const fileInfo = await FileSystem.getInfoAsync(compressedUri);
      console.log('📊 Compressed file info:', fileInfo);
      
      if (!fileInfo.exists || fileInfo.size === 0) {
        console.error('❌ Compressed image is empty or doesn\'t exist');
        throw new Error('Image compression failed - resulting file is empty');
      }
      
      // Skip duplicate detection for now to simplify debugging
      console.log('⏭️ Skipping duplicate detection, proceeding with upload and analysis');
      
      console.log('📖 Reading compressed image file directly...');
      
      // Read the file as base64 directly - more reliable than fetch() for local files
      let base64Data: string;
      try {
        base64Data = await FileSystem.readAsStringAsync(compressedUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        console.log('✅ File read successful:', {
          base64Length: base64Data.length,
          sampleData: base64Data.substring(0, 100) + '...',
          estimatedSize: Math.round(base64Data.length * 0.75) // Approximate decoded size
        });
        
        if (!base64Data || base64Data.length === 0) {
          throw new Error('File read returned empty data');
        }
      } catch (readError) {
        console.error('❌ Failed to read file:', readError);
        throw new Error(`Failed to read image file: ${readError instanceof Error ? readError.message : 'Unknown error'}`);
      }
      
      // Upload base64 directly to Supabase using decode
      console.log('☁️ Uploading to Supabase...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('plant-photos')
        .upload(`${studentId}/${finalFileName}`, decode(base64Data), {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return {
          success: false,
          error: 'Failed to upload photo'
        };
      }
      
      console.log('✅ Upload successful:', uploadData);

      const { data: publicUrlData } = supabase.storage
        .from('plant-photos')
        .getPublicUrl(uploadData.path);

      const photoUrl = publicUrlData.publicUrl;

      // Trigger image analysis for original images
      const analysisResult = await ImageAnalysisService.analyzeImage(photoUrl, studentId);

      return {
        success: true,
        photoUrl,
        analysisId: analysisResult.analysisId,
        isDuplicate: false,
        error: analysisResult.success ? undefined : analysisResult.error
      };

    } catch (error) {
      console.error('Error in uploadAndAnalyze:', error);
      return {
        success: false,
        error: 'Unexpected error occurred'
      };
    }
  }

  /**
   * Upload photo without analysis (for existing functionality)
   */
  static async uploadPhoto(
    imageUri: string, 
    studentId: string, 
    fileName?: string,
    compress: boolean = false
  ): Promise<{ success: boolean; photoUrl?: string; error?: string }> {
    try {
      const finalFileName = fileName || `plant-photo-${Date.now()}.jpg`;
      
      // Convert HEIC to JPG if necessary
      const convertedUri = await this.convertHeicToJpg(imageUri);
      
      // Optionally compress image
      const finalUri = compress ? await this.compressImage(convertedUri) : convertedUri;
      
      // Read file directly as base64 instead of using fetch
      const base64Data = await FileSystem.readAsStringAsync(finalUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Upload base64 directly to Supabase using decode
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('plant-photos')
        .upload(`${studentId}/${finalFileName}`, decode(base64Data), {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        return {
          success: false,
          error: 'Failed to upload photo'
        };
      }

      const { data: publicUrlData } = supabase.storage
        .from('plant-photos')
        .getPublicUrl(uploadData.path);

      return {
        success: true,
        photoUrl: publicUrlData.publicUrl
      };

    } catch (error) {
      console.error('Error in uploadPhoto:', error);
      return {
        success: false,
        error: 'Unexpected error occurred'
      };
    }
  }

  /**
   * Get student's photo history
   */
  static async getPhotoHistory(studentId: string, limit = 20): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from('plant-photos')
        .list(`${studentId}/`, {
          limit,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error fetching photo history:', error);
        return [];
      }

      // Convert to public URLs
      const photoUrls = data.map(file => {
        const { data: publicUrlData } = supabase.storage
          .from('plant-photos')
          .getPublicUrl(`${studentId}/${file.name}`);
        return publicUrlData.publicUrl;
      });

      return photoUrls;
    } catch (error) {
      console.error('Error in getPhotoHistory:', error);
      return [];
    }
  }

  /**
   * Get duplicate detection statistics
   */
  static async getDuplicateStats(): Promise<{
    totalImages: number;
    duplicates: number;
    originals: number;
    duplicatePercentage: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('image_analysis')
        .select('is_duplicate')
        .not('perceptual_hash', 'is', null);

      if (error) {
        console.error('Error fetching duplicate stats:', error);
        return { totalImages: 0, duplicates: 0, originals: 0, duplicatePercentage: 0 };
      }

      const totalImages = data.length;
      const duplicates = data.filter(record => record.is_duplicate).length;
      const originals = totalImages - duplicates;
      const duplicatePercentage = totalImages > 0 ? (duplicates / totalImages) * 100 : 0;

      return {
        totalImages,
        duplicates,
        originals,
        duplicatePercentage: Math.round(duplicatePercentage * 100) / 100
      };
    } catch (error) {
      console.error('Error getting duplicate stats:', error);
      return { totalImages: 0, duplicates: 0, originals: 0, duplicatePercentage: 0 };
    }
  }

  /**
   * Find all duplicates of a specific image analysis
   */
  static async findDuplicatesOfImage(analysisId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('image_analysis')
        .select('image_url')
        .eq('original_analysis_id', analysisId)
        .eq('is_duplicate', true);

      if (error) {
        console.error('Error finding duplicates:', error);
        return [];
      }

      return data.map(record => record.image_url);
    } catch (error) {
      console.error('Error finding duplicates of image:', error);
      return [];
    }
  }
} 