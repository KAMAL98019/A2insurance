import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

export type UploadFolder = 'rc' | 'insurance' | 'aadhaar' | 'pan' | 'photo' | 'od' | 'tp';

const ALLOWED_MIME: Record<UploadFolder, string[]> = {
  rc:        ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  insurance: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  aadhaar:   ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  pan:       ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  photo:     ['image/jpeg', 'image/png', 'image/webp'],
  od:        ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  tp:        ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  private extractPublicId(url: string): { publicId: string; resourceType: 'image' | 'raw' } | null {
    try {
      const isRaw = url.includes('/raw/upload/');
      const cleanUrl = url.split('?')[0].split('#')[0];
      const match = cleanUrl.match(/\/(?:image|raw)\/upload\/(?:v\d+\/)?(.+)$/);
      if (!match) {
        this.logger.warn(`extractPublicId: no match for url=${url}`);
        return null;
      }
      const publicId = isRaw ? match[1] : match[1].replace(/\.[^/.]+$/, '');
      return { publicId, resourceType: isRaw ? 'raw' : 'image' };
    } catch {
      return null;
    }
  }

  async destroy(url: string): Promise<void> {
    const info = this.extractPublicId(url);
    if (!info) {
      this.logger.warn(`destroy: could not extract publicId from url=${url}`);
      return;
    }
    this.logger.debug(`destroy: publicId=${info.publicId} resourceType=${info.resourceType}`);
    try {
      const result = await cloudinary.uploader.destroy(info.publicId, { resource_type: info.resourceType });
      if (result?.result !== 'ok') {
        this.logger.warn(`destroy: unexpected result=${JSON.stringify(result)} for publicId=${info.publicId}`);
      }
    } catch (err) {
      this.logger.error(`destroy failed for publicId=${info.publicId}: ${(err as Error).message}`);
    }
  }

  async upload(file: Express.Multer.File, folder: UploadFolder): Promise<string> {
    if (!ALLOWED_MIME[folder].includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${ALLOWED_MIME[folder].join(', ')}`,
      );
    }

    const isPdf    = file.mimetype === 'application/pdf';
    const maxBytes = isPdf ? 5 * 1024 * 1024 : 1 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `File too large. ${isPdf ? 'PDF max 5 MB' : 'Image max 1 MB'}.`,
      );
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `a2insurance/${folder}`,
          resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
          use_filename: false,
          unique_filename: true,
        },
        (error, result: UploadApiResponse) => {
          if (error) return reject(new BadRequestException(error.message));
          resolve(result.secure_url);
        },
      );

      const readable = new Readable();
      readable.push(file.buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }
}
