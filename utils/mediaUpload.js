// utils/mediaUpload.js
import { supabaseClient } from '../supabaseClient.js';

/**
 * Upload un fichier (image ou vidéo) vers Supabase Storage.
 * 
 * @param {File} file - fichier sélectionné par l'utilisateur
 * @returns {Promise<{media_url: string, media_type: 'image'|'video'|'unknown'}>}
 */
export async function uploadMedia(file) {
  if (!file || file.size === 0) {
    throw new Error('Aucun fichier valide fourni.');
  }

  // Vérifications de base
  if (file.size > 10 * 1024 * 1024) { // 10MB max
    throw new Error('Le fichier est trop volumineux (max 10 Mo).');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Type de fichier non supporté. Utilisez JPG, PNG, WebP ou MP4/WebM.');
  }

  try {
    // 1) Déterminer le dossier et le type
    const mediaType = file.type.startsWith('image/') ? 'image' : 
                     file.type.startsWith('video/') ? 'video' : 'unknown';
    
    const bucketName = 'restaurant-media'; // À créer dans Supabase Storage
    const folder = mediaType === 'image' ? 'images' : 'videos';
    
    // 2) Générer un nom unique : timestamp + hash du nom original
    const timestamp = Date.now();
    const fileNameSafe = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${timestamp}_${fileNameSafe}`;

    // 3) Upload vers Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from(bucketName)
      .upload(`${folder}/${uniqueName}`, file, {
        cacheControl: '3600', // 1h cache
        upsert: false, // ne pas écraser
      });

    if (error) {
      console.error('Erreur upload Storage:', error);
      throw new Error(`Erreur upload: ${error.message}`);
    }

    // 4) Générer l'URL publique
    const { data: { publicUrl } } = supabaseClient.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    console.log('Upload réussi:', publicUrl);

    return {
      media_url: publicUrl,
      media_type: mediaType,
      file_path: data.path, // pour suppression future si besoin
    };

  } catch (err) {
    console.error('Erreur upload:', err);
    throw err;
  }
}

/**
 * Supprime un média depuis Supabase Storage.
 * Utilisé par dishActions.js si tu veux supprimer les images lors de la suppression d'un plat.
 * 
 * @param {string} filePath - chemin du fichier (ex: "images/123456_salade.jpg")
 * @returns {Promise<boolean>}
 */
export async function deleteMedia(filePath) {
  if (!filePath) return false;

  try {
    const { error } = await supabaseClient.storage
      .from('restaurant-media')
      .remove([filePath]);

    if (error) {
      console.error('Erreur suppression média:', error);
      return false;
    }

    console.log('Média supprimé:', filePath);
    return true;
  } catch (err) {
    console.error('Erreur suppression:', err);
    return false;
  }
}

/**
 * Génère un aperçu (thumbnail) pour les vidéos (optionnel).
 * Pour l'instant, on renvoie juste l'URL publique.
 */
export function getMediaPreviewUrl(mediaUrl, mediaType) {
  return mediaUrl; // L'URL publique suffit pour le dashboard
}
