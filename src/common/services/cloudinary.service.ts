/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, ConfigOptions } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly config: ConfigOptions | null;

  constructor() {
    const {
      CLOUDINARY_URL,
      CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET,
    } = process.env;

    const hasExplicitUrl = Boolean(CLOUDINARY_URL?.trim());

    if (!hasExplicitUrl && !(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)) {
      this.config = null;
      return;
    }

    if (hasExplicitUrl) {
      this.config = { secure: true, cloudinary_url: CLOUDINARY_URL };
      return;
    }

    this.config = {
      secure: true,
      cloud_name: 'dvycbineu',
      api_key: '813469998479265',
      api_secret: 'HwVoo_OkL6GqzTWttAoVPyX2efU',
    };
  }

  get enabled(): boolean {
    return this.config !== null;
  }

  async uploadImage(
    buffer: Buffer,
    folder = 'nominees',
  ): Promise<UploadApiResponse> {
    if (!this.config) {
      throw new InternalServerErrorException(
        'Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET',
      );
    }

    // Apply config on every call — guards against singleton state being reset
    cloudinary.config(this.config);

    const preset = process.env.CLOUDINARY_UPLOAD_PRESET;
    const options: Record<string, unknown> = {
      folder,
      resource_type: 'image',
      secure: true,
      ...(preset && { upload_preset: preset }),
    };

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            if (error.http_code === 401) {
              reject(
                new InternalServerErrorException(
                  `Cloudinary auth error: ${error.message}. Ensure CLOUDINARY_(URL|CLOUD_NAME|API_KEY|API_SECRET) are correct and preset ${preset ?? 'none'} is valid`,
                ),
              );
              return;
            }
            return reject(error);
          }

          if (!result) {
            return reject(new InternalServerErrorException('Cloudinary upload returned no result'));
          }

          resolve(result as UploadApiResponse);
        },
      );

      stream.end(buffer);
    });
  }
}