import { supabase } from '@/utils/supabase';
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

export class PhotoService {
  /**
   * Convert HEIC images to JPG format
   */
  static async convertHeicToJpg(uri: string): Promise<string> {
    try {
      // Check if the image is HEIC/HEIF format
      const isHeic = uri.toLowerCase().includes('.heic') || uri.toLowerCase().includes('.heif');
      
      if (!isHeic) {
        // Return original URI if not HEIC
        return uri;
      }

      // Create a temporary file path for the converted image
      const tempFileName = `converted_${Date.now()}.jpg`;
      const tempUri = `${FileSystem.documentDirectory}${tempFileName}`;

      // Copy the HEIC file to a temporary location
      await FileSystem.copyAsync({
        from: uri,
        to: tempUri,
      });

      // Convert to JPG using ImageManipulator
      const result = await manipulateAsync(
        tempUri,
        [], // No transformations, just format conversion
        {
          compress: 1, // No compression during conversion
          format: SaveFormat.JPEG,
        }
      );

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
      const result = await manipulateAsync(
        uri,
        [{ resize: { width: maxWidth } }],
        { compress: quality, format }
      );
      return result.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      // Return original URI if compression fails
      return uri;
    }
  }

  /**
   * Upload a photo and trigger analysis
   */
  static async uploadAndAnalyze(
    imageUri: string, 
    studentId: string, 
    fileName?: string
  ): Promise<PhotoUploadResult> {
    try {
      // Generate filename if not provided
      const finalFileName = fileName || `plant-photo-${Date.now()}.jpg`;
      
      // Convert HEIC to JPG if necessary
      const convertedUri = await this.convertHeicToJpg(imageUri);
      
      // Compress image for analysis (to stay under 4MB limit)
      const compressedUri = await this.compressImage(convertedUri, SaveFormat.JPEG, 1200, 0.7);
      
      // Convert compressed image URI to blob for upload
      const response = await fetch(compressedUri);
      const blob = await response.blob();
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('plant-photos')
        .upload(`${studentId}/${finalFileName}`, blob, {
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

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('plant-photos')
        .getPublicUrl(uploadData.path);

      const photoUrl = publicUrlData.publicUrl;

      // Trigger image analysis
      const analysisResult = await ImageAnalysisService.analyzeImage(photoUrl, studentId);
      
      if (!analysisResult.success) {
        console.warn('Analysis failed but photo uploaded successfully');
      }

      return {
        success: true,
        photoUrl,
        analysisId: analysisResult.analysisId,
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
      
      const response = await fetch(finalUri);
      const blob = await response.blob();
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('plant-photos')
        .upload(`${studentId}/${finalFileName}`, blob, {
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
} 