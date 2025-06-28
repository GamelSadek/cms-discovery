import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PublishersService } from './publishers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdatePublisherDto } from './dto/update-publisher.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
  };
}

@ApiTags('Publishers')
@ApiBearerAuth()
@Controller('publishers')
@UseGuards(JwtAuthGuard)
export class PublishersController {
  constructor(private readonly publishersService: PublishersService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get publisher profile',
    description: `
    Retrieve the authenticated publisher's profile information.
    
    Features:
    - جلب معلومات الملف الشخصي للناشر المصادق عليه
    - Complete publisher account details
    - Personal information and settings
    - Account status and permissions
    - Registration and activity dates
    
    Returns the current user's profile data based on JWT token.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-string' },
        email: { type: 'string', example: 'publisher@example.com' },
        firstName: { type: 'string', example: 'Ahmed' },
        lastName: { type: 'string', example: 'Hassan' },
        bio: { type: 'string', example: 'Content creator and podcaster' },
        website: { type: 'string', example: 'https://mywebsite.com' },
        createdAt: { type: 'string', example: '2025-06-26T21:00:00.000Z' },
        programCount: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.publishersService.getProfile(req.user.userId);
  }

  @Put('profile')
  @ApiOperation({
    summary: 'Update publisher profile',
    description: `
    Update the authenticated publisher's profile information.
    
    Features:
    - تحديث معلومات الملف الشخصي للناشر
    - Modify personal information
    - Update bio and contact details
    - Change display preferences
    - Maintain account security
    
    Only the authenticated publisher can update their own profile.
    `,
  })
  @ApiBody({
    description: 'Updated profile information',
    type: UpdatePublisherDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Profile updated successfully' },
        publisher: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            bio: { type: 'string' },
            website: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid profile data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() body: UpdatePublisherDto,
  ) {
    return this.publishersService.updateProfile(req.user.userId, body);
  }

  @Put('change-password')
  changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() body: ChangePasswordDto,
  ) {
    return this.publishersService.changePassword(
      req.user.userId,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Delete('profile')
  deleteAccount(@Request() req: AuthenticatedRequest) {
    return this.publishersService.deleteAccount(req.user.userId);
  }
}
