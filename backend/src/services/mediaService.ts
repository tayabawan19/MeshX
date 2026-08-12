import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'snvyczy3',
    api_key: process.env.CLOUDINARY_API_KEY || '215339976581174',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'UDAHBcSEMzqa3O-rc5RxwStgthU',
  });
};

export const uploadMedia = (
  fileBuffer: Buffer,
  mimeType: string,
  category: 'image' | 'voice' | 'document'
): Promise<{ mediaUrl: string; mediaType: string }> => {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    let folder = 'everchat/images';
    let resourceType: 'image' | 'raw' | 'video' | 'auto' = 'image';

    if (category === 'voice') {
      folder = 'everchat/voice';
      resourceType = 'video'; // Cloudinary uses 'video' for audio files like m4a, mp3, wav
    } else if (category === 'document') {
      folder = 'everchat/documents';
      resourceType = 'raw';
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary Upload Error]', error);
          return reject(new Error(`Cloudinary Upload Error: ${error.message}`));
        }
        if (!result || !result.secure_url) {
          return reject(new Error('Cloudinary Upload Error: Secure URL not returned'));
        }
        console.log(`[Cloudinary Upload Success] File uploaded to ${result.secure_url}`);
        resolve({
          mediaUrl: result.secure_url,
          mediaType: category,
        });
      }
    );

    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null);
    stream.pipe(uploadStream);
  });
};
