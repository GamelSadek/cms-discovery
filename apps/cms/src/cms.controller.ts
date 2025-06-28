import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CmsService } from './cms.service';

@ApiTags('cms')
@Controller()
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get()
  @ApiOperation({
    summary: 'CMS System Health Check',
    description: `
    Get the health status and welcome message of the CMS system.
    
    Features:
    - فحص حالة نظام إدارة المحتوى
    - System health verification
    - API availability confirmation
    - Basic connectivity test
    
    Use this endpoint to verify that the CMS API is running and accessible.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'CMS system is running successfully',
    schema: {
      type: 'string',
      example:
        'thmanyah CMS API is running! Welcome to the Content Management System.',
    },
  })
  getHello(): string {
    return this.cmsService.getHello();
  }

  @Get('info')
  @ApiOperation({
    summary: 'Get CMS System Information',
    description:
      'Detailed information about the CMS system capabilities and status',
  })
  @ApiResponse({
    status: 200,
    description: 'System information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        version: { type: 'string' },
        description: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        status: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  })
  getSystemInfo() {
    return this.cmsService.getSystemInfo();
  }
}
