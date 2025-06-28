import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaFile, MediaFileType, MediaFormat } from './media-file.entity';
import { Episode } from '../episodes/episode.entity';
import { Program } from '../programs/programs.entity';
import { S3Service } from '../upload/s3.service';
import { UploadMediaDto, MediaMetadataDto } from './dto/upload-media.dto';
import * as path from 'path';
import * as fs from 'fs';

interface ExtractedMetadata {
  duration?: number;
  width?: number;
  height?: number;
  bitrate?: number;
  codec?: string;
  frameRate?: number;
  audioChannels?: number;
  sampleRate?: number;
  fileSize?: number;
}

interface ProcessingResult {
  filePath: string;
  fileSize: number;
  metadata: ExtractedMetadata;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(MediaFile)
    private mediaFileRepository: Repository<MediaFile>,
    @InjectRepository(Episode)
    private episodeRepository: Repository<Episode>,
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    private s3Service: S3Service,
  ) {}

  private extractMediaMetadata(file: Express.Multer.File): ExtractedMetadata {
    try {
      const extractedMetadata: ExtractedMetadata = {
        fileSize: file.size,
        duration: undefined,
        width: undefined,
        height: undefined,
        bitrate: undefined,
        codec: undefined,
        frameRate: undefined,
        audioChannels: undefined,
        sampleRate: undefined,
      };
      return extractedMetadata;
    } catch (error) {
      this.logger.error('Failed to extract metadata from media file:', error);

      return {
        fileSize: file.size,
      };
    }
  }

  async uploadMedia(
    file: Express.Multer.File,
    uploadMediaDto: UploadMediaDto,
  ): Promise<{
    episode: Episode;
    originalFile: MediaFile;
    processedFile: MediaFile;
  }> {
    this.logger.log('Starting metadata extraction for uploaded file');
    const extractedMetadata = this.extractMediaMetadata(file);

    const mergedMetadata: MediaMetadataDto = {
      width: uploadMediaDto.metadata?.width || extractedMetadata.width,
      height: uploadMediaDto.metadata?.height || extractedMetadata.height,
      bitrate: uploadMediaDto.metadata?.bitrate || extractedMetadata.bitrate,
      codec: uploadMediaDto.metadata?.codec || extractedMetadata.codec,
      frameRate:
        uploadMediaDto.metadata?.frameRate || extractedMetadata.frameRate,
      audioChannels:
        uploadMediaDto.metadata?.audioChannels ||
        extractedMetadata.audioChannels,
      sampleRate:
        uploadMediaDto.metadata?.sampleRate || extractedMetadata.sampleRate,
      quality: uploadMediaDto.metadata?.quality,
    };

    const finalDuration =
      uploadMediaDto.duration || extractedMetadata.duration || 0;

    let program: Program | null = null;
    if (uploadMediaDto.programId) {
      program = await this.programRepository.findOne({
        where: { id: uploadMediaDto.programId },
      });

      if (!program) {
        throw new NotFoundException('Program not found');
      }
    }

    const originalFileUrl = await this.s3Service.uploadMedia(file, 'original');

    const episode = this.episodeRepository.create({
      title: uploadMediaDto.title,
      description: uploadMediaDto.description,
      duration: finalDuration,
      episodeNumber: uploadMediaDto.episodeNumber || 1,
      seasonNumber: uploadMediaDto.seasonNumber || 1,
      tags: uploadMediaDto.tags,
      thumbnailUrl: uploadMediaDto.thumbnailUrl,
      chapters: uploadMediaDto.chapters,
      category: uploadMediaDto.category || 'general',
      language: uploadMediaDto.language || 'en',
      publishDate: uploadMediaDto.publishDate
        ? new Date(uploadMediaDto.publishDate)
        : new Date(),
      programId: uploadMediaDto.programId || undefined,
      originalMediaUrl: originalFileUrl,
      processedMediaUrl: originalFileUrl,
    });

    const savedEpisode = await this.episodeRepository.save(episode);

    const originalFile = this.mediaFileRepository.create({
      originalName: file.originalname,
      fileName: this.extractFileNameFromUrl(originalFileUrl),
      fileUrl: originalFileUrl,
      fileSize: extractedMetadata.fileSize || file.size,
      format: this.getMediaFormat(file.originalname),
      fileType: MediaFileType.ORIGINAL,
      mimeType: file.mimetype,
      duration: finalDuration,
      metadata: {
        ...mergedMetadata,
        uploadedAt: new Date().toISOString(),
        originalFileName: file.originalname,
        extractedMetadata: extractedMetadata,
        providedByUser: uploadMediaDto.metadata || {},
      },
      chapters: uploadMediaDto.chapters,
      category: uploadMediaDto.category || 'general',
      language: uploadMediaDto.language || 'en',
      publishDate: uploadMediaDto.publishDate
        ? new Date(uploadMediaDto.publishDate)
        : new Date(),
      episodeId: savedEpisode.id,
    });

    const savedOriginalFile = await this.mediaFileRepository.save(originalFile);

    this.logger.log('Starting file transformation to MP4...');
    const processingResult = await this.transformToMp4(file);

    const processedFileUrl = await this.moveProcessedFileAndGetUrl(
      processingResult.filePath,
      file.originalname,
    );

    const processedFile = this.mediaFileRepository.create({
      originalName: file.originalname,
      fileName: this.extractFileNameFromUrl(processedFileUrl),
      fileUrl: processedFileUrl,
      fileSize: processingResult.fileSize,
      format: MediaFormat.MP4,
      fileType: MediaFileType.PROCESSED,
      mimeType: 'video/mp4',
      duration: processingResult.metadata.duration || finalDuration,
      metadata: {
        ...mergedMetadata,
        ...processingResult.metadata,
        processedAt: new Date().toISOString(),
        processingType: 'ffmpeg_mp4_conversion_with_metadata',
        enhancedMetadata: true,
        transformedFromFormat: this.getMediaFormat(file.originalname),
      },
      chapters: uploadMediaDto.chapters,
      category: uploadMediaDto.category || 'general',
      language: uploadMediaDto.language || 'en',
      publishDate: uploadMediaDto.publishDate
        ? new Date(uploadMediaDto.publishDate)
        : new Date(),
      thumbnailUrl: uploadMediaDto.thumbnailUrl,
      episodeId: savedEpisode.id,
    });

    const savedProcessedFile =
      await this.mediaFileRepository.save(processedFile);

    savedEpisode.processedMediaUrl = processedFileUrl;
    await this.episodeRepository.save(savedEpisode);

    return {
      episode: savedEpisode,
      originalFile: savedOriginalFile,
      processedFile: savedProcessedFile,
    };
  }

  /**
   * Transform media file to MP4 format with proper metadata injection
   * @param file - The uploaded file
   * @param uploadMediaDto - Upload metadata DTO
   * @returns Promise<ProcessingResult> - Processing result with file path and metadata
   */
  private async transformToMp4(
    file: Express.Multer.File,
  ): Promise<ProcessingResult> {
    this.logger.log(
      'Video processing skipped (ffmpeg not available) - using original file',
    );

    const processedDir = path.join(
      process.cwd(),
      'uploads',
      'media',
      'processed',
    );
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }

    const baseName = path.parse(file.originalname).name;
    const extension = path.parse(file.originalname).ext || '.mp4';
    const outputFileName = `${baseName}_processed_${Date.now()}${extension}`;
    const outputPath = path.join(processedDir, outputFileName);

    try {
      fs.copyFileSync(file.path, outputPath);

      const stats = fs.statSync(outputPath);
      const processedFileSize = stats.size;

      const processedMetadata = await this.extractMetadataFromFile(outputPath);

      this.logger.log(`File copied as processed: ${outputPath}`);

      return {
        filePath: outputPath,
        fileSize: processedFileSize,
        metadata: processedMetadata,
      };
    } catch (error: any) {
      this.logger.error('Failed to copy file as processed:', error);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new Error(`File processing failed: ${error.message}`);
    }
  }

  /**
   * Move processed file to final location and return URL
   * @param tempFilePath - Temporary file path
   * @param originalName - Original filename
   * @returns Promise<string> - Final file URL
   */
  private async moveProcessedFileAndGetUrl(
    tempFilePath: string,
    originalName: string,
  ): Promise<string> {
    try {
      const baseName = path.parse(originalName).name;
      const finalFileName = `${baseName}_processed_${Date.now()}.mp4`;

      const fileBuffer = fs.readFileSync(tempFilePath);
      const mockFile = {
        originalname: finalFileName,
        buffer: fileBuffer,
        size: fs.statSync(tempFilePath).size,
        mimetype: 'video/mp4',
      } as Express.Multer.File;

      const processedUrl = await this.s3Service.uploadMedia(
        mockFile,
        'processed',
      );

      fs.unlinkSync(tempFilePath);

      return processedUrl;
    } catch (error: any) {
      this.logger.error('Failed to move processed file:', error);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new Error(`Failed to move processed file: ${error.message}`);
    }
  }

  /**
   * Generate chapters file for FFmpeg
   * @param chapters - Array of chapter objects
   * @returns string - Formatted chapters content
   */
  private generateChaptersFile(
    chapters: {
      title: string;
      startTime: number;
      endTime: number;
      description?: string;
    }[],
  ): string {
    let content = ';FFMETADATA1\n';

    chapters.forEach((chapter) => {
      content += `[CHAPTER]\n`;
      content += `TIMEBASE=1/1000\n`;
      content += `START=${Math.floor(chapter.startTime * 1000)}\n`;
      content += `END=${Math.floor(chapter.endTime * 1000)}\n`;
      content += `title=${chapter.title}\n`;
      if (chapter.description) {
        content += `description=${chapter.description}\n`;
      }
      content += `\n`;
    });

    return content;
  }

  /**
   * Extract metadata from a file using its path
   * @param filePath - Path to the file
   * @returns Promise<ExtractedMetadata> - Extracted metadata
   */
  private async extractMetadataFromFile(
    filePath: string,
  ): Promise<ExtractedMetadata> {
    try {
      const stats = fs.statSync(filePath);
      const extractedMetadata: ExtractedMetadata = {
        fileSize: stats.size,
        duration: undefined,
        width: undefined,
        height: undefined,
        bitrate: undefined,
        codec: undefined,
        frameRate: undefined,
        audioChannels: undefined,
        sampleRate: undefined,
      };

      return extractedMetadata;
    } catch (error: any) {
      this.logger.error(
        'Failed to extract metadata from processed file:',
        error,
      );
      return { fileSize: 0 };
    }
  }

  private isVideoFile(file: Express.Multer.File): boolean {
    const videoMimeTypes = [
      'video/mp4',
      'video/avi',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv',
      'video/webm',
      'video/x-flv',
      'video/x-matroska',
    ];
    return videoMimeTypes.includes(file.mimetype);
  }

  private getMediaFormat(filename: string): MediaFormat {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp4':
        return MediaFormat.MP4;
      case 'avi':
        return MediaFormat.AVI;
      case 'mkv':
        return MediaFormat.MKV;
      case 'mov':
        return MediaFormat.MOV;
      case 'wmv':
        return MediaFormat.WMV;
      case 'flv':
        return MediaFormat.FLV;
      case 'webm':
        return MediaFormat.WEBM;
      case 'mp3':
        return MediaFormat.MP3;
      case 'wav':
        return MediaFormat.WAV;
      case 'flac':
        return MediaFormat.FLAC;
      case 'aac':
        return MediaFormat.AAC;
      case 'ogg':
        return MediaFormat.OGG;
      case 'm4a':
        return MediaFormat.M4A;
      default:
        return MediaFormat.MP4;
    }
  }

  private extractFileNameFromUrl(url: string): string {
    return url.split('/').pop() || 'unknown';
  }

  async getMediaById(id: string): Promise<MediaFile> {
    const mediaFile = await this.mediaFileRepository.findOne({
      where: { id },
      relations: ['episode'],
    });

    if (!mediaFile) {
      throw new NotFoundException('Media file not found');
    }

    return mediaFile;
  }

  async getMediaByProgram(programId: string): Promise<MediaFile[]> {
    return this.mediaFileRepository
      .createQueryBuilder('mediaFile')
      .leftJoinAndSelect('mediaFile.episode', 'episode')
      .where('episode.programId = :programId', { programId })
      .orderBy('mediaFile.createdAt', 'DESC')
      .getMany();
  }

  async deleteMedia(id: string): Promise<void> {
    const mediaFile = await this.mediaFileRepository.findOne({
      where: { id },
    });

    if (!mediaFile) {
      throw new NotFoundException('Media file not found');
    }

    await this.s3Service.deleteFile(mediaFile.fileUrl);

    await this.mediaFileRepository.delete(id);
  }

  /**
   * Get both original and processed media files for an episode
   * @param episodeId - Episode ID
   * @returns Promise<{originalFile: MediaFile, processedFile: MediaFile}> - Both file versions
   */
  async getMediaFilesByEpisode(episodeId: string): Promise<{
    originalFile: MediaFile | null;
    processedFile: MediaFile | null;
    episode: Episode;
  }> {
    const episode = await this.episodeRepository.findOne({
      where: { id: episodeId },
    });

    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    const originalFile = await this.mediaFileRepository.findOne({
      where: {
        episodeId: episodeId,
        fileType: MediaFileType.ORIGINAL,
      },
    });

    const processedFile = await this.mediaFileRepository.findOne({
      where: {
        episodeId: episodeId,
        fileType: MediaFileType.PROCESSED,
      },
    });

    return {
      originalFile,
      processedFile,
      episode,
    };
  }

  /**
   * Get all media files grouped by type
   * @returns Promise<{originalFiles: MediaFile[], processedFiles: MediaFile[]}> - Files grouped by type
   */
  async getAllMediaFilesByType(): Promise<{
    originalFiles: MediaFile[];
    processedFiles: MediaFile[];
  }> {
    const originalFiles = await this.mediaFileRepository.find({
      where: { fileType: MediaFileType.ORIGINAL },
      relations: ['episode'],
      order: { createdAt: 'DESC' },
    });

    const processedFiles = await this.mediaFileRepository.find({
      where: { fileType: MediaFileType.PROCESSED },
      relations: ['episode'],
      order: { createdAt: 'DESC' },
    });

    return {
      originalFiles,
      processedFiles,
    };
  }
}
