import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn('Cloudinary credentials missing from environment variables.');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    this.logger.log('Cloudinary SDK initialized successfully.');
  }

  /**
   * Uploads a local file path or remote URL to Cloudinary with auto-format and auto-quality compression.
   */
  async uploadFile(
    source: string,
    options: {
      folder?: string;
      publicId?: string;
      tags?: string[];
      transformation?: any[];
    } = {},
  ): Promise<UploadApiResponse> {
    const { folder = 'manamm/products', publicId, tags, transformation } = options;

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        source,
        {
          folder,
          public_id: publicId,
          tags,
          resource_type: 'auto',
          fetch_format: 'auto',
          quality: 'auto:good',
          transformation: transformation || [
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            this.logger.error(`Failed to upload ${source} to Cloudinary: ${error.message}`);
            return reject(error);
          }
          resolve(result);
        },
      );
    });
  }

  /**
   * Uploads an in-memory buffer (e.g., from Multer memoryStorage) directly to Cloudinary.
   */
  async uploadBuffer(
    buffer: Buffer,
    options: {
      folder?: string;
      publicId?: string;
      tags?: string[];
    } = {},
  ): Promise<UploadApiResponse> {
    const { folder = 'manamm/uploads', publicId, tags } = options;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          tags,
          resource_type: 'auto',
          fetch_format: 'auto',
          quality: 'auto:good',
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            this.logger.error(`Buffer upload failed: ${error.message}`);
            return reject(error);
          }
          resolve(result);
        },
      );

      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);
      stream.pipe(uploadStream);
    });
  }

  /**
   * Deletes an asset from Cloudinary using its public ID.
   */
  async deleteFile(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          this.logger.error(`Failed to delete ${publicId}: ${error.message}`);
          return reject(error);
        }
        resolve(result);
      });
    });
  }

  /**
   * Generates an optimized Cloudinary delivery URL with automatic format and quality compression.
   */
  getOptimizedUrl(publicId: string, options: { width?: number; height?: number; crop?: string } = {}): string {
    const { width, height, crop = 'limit' } = options;
    const transformations: any = {
      fetch_format: 'auto',
      quality: 'auto:good',
    };

    if (width) transformations.width = width;
    if (height) transformations.height = height;
    if (width || height) transformations.crop = crop;

    return cloudinary.url(publicId, {
      secure: true,
      transformation: [transformations],
    });
  }
}
