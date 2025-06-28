import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register new publisher',
    description: `
    Register a new publisher account in the CMS system.
    
    Features:
    - تسجيل ناشر جديد في نظام إدارة المحتوى
    - Create new publisher account
    - Email validation and uniqueness check
    - Password encryption and security
    - Automatic account activation
    
    This endpoint allows new publishers to create accounts and start managing content.
    `,
  })
  @ApiConsumes('application/json')
  @ApiBody({
    description: 'Publisher registration data',
    type: RegisterDto,
    examples: {
      example1: {
        summary: 'Sample registration',
        value: {
          email: 'publisher@example.com',
          password: 'SecurePassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Publisher registered successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Publisher registered successfully',
        },
        publisher: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-string' },
            email: { type: 'string', example: 'publisher@example.com' },
            createdAt: { type: 'string', example: '2025-06-26T21:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data or email already exists',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Email already exists' },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Publisher login',
    description: `
    Authenticate a publisher and receive access token.
    
    Features:
    - تسجيل دخول الناشر والحصول على رمز الوصول
    - Email and password authentication
    - JWT token generation
    - Session management
    - Secure access to protected endpoints
    
    Use the returned access token in the Authorization header for protected endpoints.
    `,
  })
  @ApiConsumes('application/json')
  @ApiBody({
    description: 'Publisher login credentials',
    type: LoginDto,
    examples: {
      example1: {
        summary: 'Sample login',
        value: {
          email: 'publisher@example.com',
          password: 'SecurePassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Login successful' },
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        publisher: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-string' },
            email: { type: 'string', example: 'publisher@example.com' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' },
        statusCode: { type: 'number', example: 401 },
      },
    },
  })
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }
}
