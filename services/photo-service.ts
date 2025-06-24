import { supabase, supabaseStorage } from '@/config/supabase';
import { PlantImage } from '@/types';
import { decode } from 'base64-arraybuffer';

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
    const { data: uploadData, error: uploadError } = await supabaseStorage
      .from('plant-photos')
      .upload(filename, decode(base64Data), {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabaseStorage
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
      supabaseStorage
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