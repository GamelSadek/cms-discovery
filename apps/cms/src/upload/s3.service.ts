import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || '';

    if (!region || !accessKeyId || !secretAccessKey || !this.bucketName) {
      this.logger.warn(
        'AWS S3 configuration is incomplete. File uploads will not work.',
      );
      this.logger.warn(
        'Please set: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET',
      );
      this.s3Client = new S3Client({
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'dummy',
          secretAccessKey: 'dummy',
        },
      });
      return;
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<string> {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

      this.logger.log(`Uploading file: ${fileName} (${file.size} bytes)`);

      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        },
      });

      await upload.done();
      const fileUrl = `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;

      return fileUrl;
    } catch (error) {
      this.logger.error(
        `Failed to upload file: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new Error(`File upload failed: ${(error as Error).message}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const urlPattern = new RegExp(
        `https://${this.bucketName}\\.s3\\.amazonaws\\.com/(.+)`,
      );
      const match = fileUrl.match(urlPattern);

      if (!match || !match[1]) {
        throw new Error('Invalid file URL format');
      }

      const key = match[1];
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to delete file: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return false;
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return this.uploadFile(file, 'images');
  }

  async uploadVideo(file: Express.Multer.File): Promise<string> {
    return this.uploadFile(file, 'videos');
  }

  async uploadAudio(file: Express.Multer.File): Promise<string> {
    return this.uploadFile(file, 'audio');
  }

  async uploadDocument(file: Express.Multer.File): Promise<string> {
    return this.uploadFile(file, 'documents');
  }

  // Media-specific upload method
  async uploadMedia(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    if (file.mimetype.startsWith('video/')) {
      return this.uploadVideo(file);
    } else if (file.mimetype.startsWith('audio/')) {
      return this.uploadAudio(file);
    } else {
      return this.uploadFile(file, folder);
    }
  }

  // Health check method
  async isConfigured(): Promise<boolean> {
    return !!(
      this.configService.get('AWS_REGION') &&
      this.configService.get('AWS_ACCESS_KEY_ID') &&
      this.configService.get('AWS_SECRET_ACCESS_KEY') &&
      this.configService.get('AWS_S3_BUCKET')
    );
  }
}
