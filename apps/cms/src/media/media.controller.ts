import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Body,
  Param,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MediaService } from './media.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Media Upload')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiOperation({
    summary: 'Upload media file (video/audio) with metadata',
    description: `
    Upload a media file (video or audio) for podcasts or documentaries with complete metadata.
    
    Features:
    - إدخال أو تعديل البرامج المرئية (بودكاست أو أفلام وثائقية)
    - تخصيص البيانات الوصفية: العنوان، الوصف، التصنيف، اللغة، المدة، تاريخ النشر
    - دعم الفصول (Chapters)
    - حفظ نسختين: النسخة الأصلية والنسخة المعدلة
    
    Supported formats: MP4, AVI, MKV, MOV, WEBM, MP3, WAV, FLAC, AAC, OGG, M4A
    `,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Media file and metadata',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Media file (video or audio)',
        },
        title: {
          type: 'string',
          description: 'Media title (العنوان)',
        },
        description: {
          type: 'string',
          description: 'Media description (الوصف)',
        },
        category: {
          type: 'string',
          description: 'Media category (التصنيف)',
          example: 'podcast',
        },
        language: {
          type: 'string',
          description: 'Media language (اللغة)',
          example: 'ar',
        },
        duration: {
          type: 'number',
          description: 'Duration in seconds (المدة) - optional',
        },
        publishDate: {
          type: 'string',
          format: 'date-time',
          description: 'Publish date (تاريخ النشر) - optional',
        },
        programId: {
          type: 'string',
          format: 'uuid',
          description: 'Program ID this media belongs to',
        },
        episodeNumber: {
          type: 'number',
          description: 'Episode number (optional)',
        },
        seasonNumber: {
          type: 'number',
          description: 'Season number (optional)',
        },
        chapters: {
          type: 'string',
          description: 'JSON string of chapters (الفصول)',
          example:
            '[{"title":"Introduction","startTime":0,"endTime":60,"description":"Opening segment"}]',
        },
        tags: {
          type: 'string',
          description:
            'Tags for the media - supports both JSON array and comma-separated formats',
          example:
            '["podcast","technology","arabic"] or "podcast,technology,arabic"',
        },
        thumbnailUrl: {
          type: 'string',
          description: 'Thumbnail URL (optional)',
        },
      },
      required: ['file', 'title', 'description'],
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Media uploaded successfully with both original and processed versions',
    schema: {
      properties: {
        message: { type: 'string' },
        originalFile: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            fileUrl: { type: 'string' },
            fileName: { type: 'string' },
            fileSize: { type: 'number' },
          },
        },
        processedFile: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            fileUrl: { type: 'string' },
            fileName: { type: 'string' },
            fileSize: { type: 'number' },
          },
        },
        metadata: { type: 'object' },
        chapters: { type: 'array' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        // Accept video and audio files only
        if (
          !file.originalname.match(
            /\.(mp4|avi|mkv|mov|wmv|flv|webm|m4v|mp3|wav|flac|aac|ogg|wma|m4a)$/i,
          )
        ) {
          return callback(
            new BadRequestException(
              'Only video and audio files are allowed! Supported formats: MP4, AVI, MKV, MOV, WEBM, MP3, WAV, FLAC, AAC, OGG, M4A',
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024 * 1024, // 2GB
      },
    }),
  )
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('category') category?: string,
    @Body('language') language?: string,
    @Body('programId') programId?: string,
    @Body('episodeNumber') episodeNumber?: string,
    @Body('seasonNumber') seasonNumber?: string,
    @Body('chapters') chaptersJson?: string,
    @Body('tags') tagsJson?: string,
    @Body('thumbnailUrl') thumbnailUrl?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Media file is required');
    }

    try {
      let chapters: any[] | undefined = undefined;
      let tags: string[] | undefined = undefined;

      if (chaptersJson && chaptersJson.trim() !== '') {
        try {
          chapters = JSON.parse(chaptersJson);
        } catch (error) {
          console.error('Failed to parse chapters JSON:', error);
          throw new BadRequestException(
            'Invalid chapters JSON format. Expected format: [{"title":"Chapter 1","startTime":0,"endTime":60}]',
          );
        }
      }

      if (tagsJson && tagsJson.trim() !== '') {
        try {
          const parsedTags: any = JSON.parse(tagsJson);
          if (Array.isArray(parsedTags)) {
            tags = parsedTags as string[];
          } else {
            throw new Error('Tags must be an array');
          }
        } catch (error) {
          try {
            tags = tagsJson
              .split(',')
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0);
          } catch (csvError) {
            console.error('Failed to parse tags in any format:', error);
            throw new BadRequestException(
              'Invalid tags format. Expected JSON array like ["tag1","tag2","tag3"] or comma-separated string like "tag1,tag2,tag3"',
            );
          }
        }
      }

      const uploadDto: UploadMediaDto = {
        title,
        description,
        category: category || 'general',
        language: language || 'en',
        duration: 0,
        publishDate: new Date().toISOString(),
        programId: programId && programId.trim() !== '' ? programId : undefined,
        episodeNumber: episodeNumber ? parseInt(episodeNumber) : undefined,
        seasonNumber: seasonNumber ? parseInt(seasonNumber) : undefined,
        chapters,
        tags,
        thumbnailUrl,
      };

      // Upload and process media
      const result = await this.mediaService.uploadMedia(file, uploadDto);

      return {
        message:
          'Media uploaded successfully with original and processed versions',
        ...result,
      };
    } catch (error) {
      console.error('Media upload error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        'Failed to upload media file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get media file by ID',
    description: `
    Retrieve a specific media file by its unique ID.
    
    Features:
    - استرجاع ملف وسائط محدد بواسطة المعرف الفريد
    - Returns complete file information including metadata
    - Includes original and processed file details
    - Shows episode and program associations
    - Returns chapters and tags if available
    
    Use this endpoint to get detailed information about any uploaded media file.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the media file (UUID format)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Media file retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Media file ID' },
        originalName: { type: 'string', description: 'Original filename' },
        fileName: { type: 'string', description: 'Stored filename' },
        fileUrl: { type: 'string', description: 'File access URL' },
        fileSize: { type: 'number', description: 'File size in bytes' },
        format: {
          type: 'string',
          description: 'Media format (MP4, MP3, etc.)',
        },
        fileType: { type: 'string', description: 'ORIGINAL or PROCESSED' },
        mimeType: { type: 'string', description: 'MIME type' },
        duration: { type: 'number', description: 'Duration in seconds' },
        metadata: { type: 'object', description: 'Technical metadata' },
        chapters: { type: 'array', description: 'Chapter information' },
        category: { type: 'string', description: 'Media category' },
        language: { type: 'string', description: 'Media language' },
        publishDate: { type: 'string', description: 'Publish date' },
        episode: { type: 'object', description: 'Associated episode details' },
        createdAt: { type: 'string', description: 'Creation timestamp' },
        updatedAt: { type: 'string', description: 'Last update timestamp' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Media file not found',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Media file not found' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  async getMedia(@Param('id') id: string) {
    try {
      const media = await this.mediaService.getMediaById(id);
      return media;
    } catch (error) {
      console.error('Error getting media:', error);
      throw new HttpException('Media file not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get('program/:programId')
  @ApiOperation({
    summary: 'Get all media files for a program',
    description: `
    Retrieve all media files associated with a specific program.
    
    Features:
    - جلب جميع ملفات الوسائط المرتبطة ببرنامج محدد
    - Returns paginated list of media files
    - Includes both original and processed versions
    - Shows complete metadata for each file
    - Ordered by creation date (newest first)
    - Includes episode associations
    
    Perfect for getting all content related to a podcast series or documentary program.
    `,
  })
  @ApiParam({
    name: 'programId',
    description: 'Unique identifier of the program (UUID format)',
    example: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  })
  @ApiResponse({
    status: 200,
    description: 'Media files retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Media files retrieved successfully',
        },
        count: {
          type: 'number',
          description: 'Total number of media files found',
          example: 15,
        },
        mediaFiles: {
          type: 'array',
          description: 'Array of media file objects',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Media file ID' },
              originalName: {
                type: 'string',
                description: 'Original filename',
              },
              fileUrl: { type: 'string', description: 'File access URL' },
              fileSize: { type: 'number', description: 'File size in bytes' },
              format: { type: 'string', description: 'Media format' },
              fileType: {
                type: 'string',
                description: 'ORIGINAL or PROCESSED',
              },
              duration: { type: 'number', description: 'Duration in seconds' },
              category: { type: 'string', description: 'Media category' },
              language: { type: 'string', description: 'Media language' },
              episode: {
                type: 'object',
                description: 'Associated episode information',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  episodeNumber: { type: 'number' },
                  seasonNumber: { type: 'number' },
                },
              },
              createdAt: { type: 'string', description: 'Creation timestamp' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Failed to retrieve media files' },
        error: { type: 'string', example: 'Internal Server Error' },
        statusCode: { type: 'number', example: 500 },
      },
    },
  })
  async getMediaByProgram(@Param('programId') programId: string) {
    try {
      const mediaFiles = await this.mediaService.getMediaByProgram(programId);
      return {
        message: 'Media files retrieved successfully',
        count: mediaFiles.length,
        mediaFiles,
      };
    } catch (error) {
      console.error('Error getting media by program:', error);
      throw new HttpException(
        'Failed to retrieve media files',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete media file',
    description: `
    Permanently delete a media file and all its associated data.
    
    Features:
    - حذف ملف الوسائط نهائياً مع جميع البيانات المرتبطة به
    - Removes both original and processed versions
    - Deletes files from storage (local or cloud)
    - Removes database records and metadata
    - Cleans up episode associations
    - Cannot be undone - use with caution
    
    Warning: This action is irreversible. Make sure you want to permanently delete the media file.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the media file to delete (UUID format)',
    example: 'c3d4e5f6-g7h8-9012-cdef-345678901234',
  })
  @ApiResponse({
    status: 200,
    description: 'Media file deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Media file deleted successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Media file not found',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Media file not found' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to delete media file',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Failed to delete media file' },
        error: { type: 'string', example: 'Internal Server Error' },
        statusCode: { type: 'number', example: 500 },
      },
    },
  })
  async deleteMedia(@Param('id') id: string) {
    try {
      await this.mediaService.deleteMedia(id);
      return {
        message: 'Media file deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting media:', error);
      throw new HttpException(
        'Failed to delete media file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('episode/:episodeId/files')
  @ApiOperation({
    summary: 'Get both original and processed files for an episode',
    description:
      'Retrieve both the original uploaded file and the processed MP4 version for a specific episode',
  })
  @ApiParam({ name: 'episodeId', description: 'Episode ID' })
  @ApiResponse({
    status: 200,
    description: 'Both original and processed files retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Episode not found',
  })
  async getEpisodeFiles(@Param('episodeId') episodeId: string) {
    try {
      const result = await this.mediaService.getMediaFilesByEpisode(episodeId);

      return {
        success: true,
        message: 'Episode files retrieved successfully',
        data: {
          episode: {
            id: result.episode.id,
            title: result.episode.title,
            description: result.episode.description,
            duration: result.episode.duration,
            originalVideoUrl: result.episode.originalVideoUrl,
            originalAudioUrl: result.episode.originalAudioUrl,
            videoUrl: result.episode.videoUrl,
            audioUrl: result.episode.audioUrl,
          },
          originalFile: result.originalFile
            ? {
                id: result.originalFile.id,
                fileName: result.originalFile.fileName,
                fileUrl: result.originalFile.fileUrl,
                fileSize: result.originalFile.fileSize,
                format: result.originalFile.format,
                duration: result.originalFile.duration,
                metadata: result.originalFile.metadata,
                createdAt: result.originalFile.createdAt,
              }
            : null,
          processedFile: result.processedFile
            ? {
                id: result.processedFile.id,
                fileName: result.processedFile.fileName,
                fileUrl: result.processedFile.fileUrl,
                fileSize: result.processedFile.fileSize,
                format: result.processedFile.format,
                duration: result.processedFile.duration,
                metadata: result.processedFile.metadata,
                createdAt: result.processedFile.createdAt,
              }
            : null,
        },
      };
    } catch (error: any) {
      if (error.message.includes('not found')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Failed to retrieve episode files',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('files/by-type')
  @ApiOperation({
    summary: 'Get all media files grouped by type (original/processed)',
    description:
      'Retrieve all media files separated into original and processed versions',
  })
  @ApiResponse({
    status: 200,
    description: 'Media files retrieved successfully',
  })
  async getMediaFilesByType() {
    try {
      const result = await this.mediaService.getAllMediaFilesByType();

      return {
        success: true,
        message: 'Media files retrieved successfully',
        data: {
          originalFiles: result.originalFiles.map((file) => ({
            id: file.id,
            fileName: file.fileName,
            fileUrl: file.fileUrl,
            fileSize: file.fileSize,
            format: file.format,
            duration: file.duration,
            metadata: file.metadata,
            episode: file.episode
              ? {
                  id: file.episode.id,
                  title: file.episode.title,
                  description: file.episode.description,
                }
              : null,
            createdAt: file.createdAt,
          })),
          processedFiles: result.processedFiles.map((file) => ({
            id: file.id,
            fileName: file.fileName,
            fileUrl: file.fileUrl,
            fileSize: file.fileSize,
            format: file.format,
            duration: file.duration,
            metadata: file.metadata,
            episode: file.episode
              ? {
                  id: file.episode.id,
                  title: file.episode.title,
                  description: file.episode.description,
                }
              : null,
            createdAt: file.createdAt,
          })),
          stats: {
            totalOriginalFiles: result.originalFiles.length,
            totalProcessedFiles: result.processedFiles.length,
            totalOriginalSize: result.originalFiles.reduce(
              (sum, file) => sum + file.fileSize,
              0,
            ),
            totalProcessedSize: result.processedFiles.reduce(
              (sum, file) => sum + file.fileSize,
              0,
            ),
          },
        },
      };
    } catch (error: any) {
      throw new HttpException(
        'Failed to retrieve media files',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
