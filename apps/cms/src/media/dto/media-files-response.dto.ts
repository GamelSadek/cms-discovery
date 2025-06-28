export class MediaFilesResponseDto {
  originalFile: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    format: string;
    duration?: number;
    metadata?: any;
    createdAt: Date;
  };

  processedFile: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    format: string;
    duration?: number;
    metadata?: any;
    createdAt: Date;
  };

  episode: {
    id: string;
    title: string;
    description?: string;
    duration: number;
    originalVideoUrl?: string;
    originalAudioUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
  };
}
