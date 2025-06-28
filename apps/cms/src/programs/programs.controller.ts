import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ValidationPipe,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import {
  ProgramsService,
  CategoryResult,
  LanguageResult,
} from './programs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramQueryDto } from './dto/program-query.dto';

@ApiTags('programs')
@ApiBearerAuth()
@Controller('programs')
@UseGuards(JwtAuthGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new program' })
  @ApiResponse({ status: 201, description: 'Program created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid program data' })
  @ApiResponse({ status: 403, description: 'Authentication required' })
  create(@Body(ValidationPipe) body: CreateProgramDto) {
    return this.programsService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all programs' })
  @ApiResponse({ status: 200, description: 'Programs retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Authentication required' })
  findAll(@Query() query: ProgramQueryDto) {
    return this.programsService.findAll(query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get program categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Authentication required' })
  getCategories(): Promise<CategoryResult[]> {
    return this.programsService.getCategories();
  }

  @Get('languages')
  @ApiOperation({ summary: 'Get program languages' })
  @ApiResponse({ status: 200, description: 'Languages retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Authentication required' })
  getLanguages(): Promise<LanguageResult[]> {
    return this.programsService.getLanguages();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get program by ID' })
  @ApiResponse({ status: 200, description: 'Program retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  @ApiResponse({ status: 403, description: 'Authentication required' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.programsService.findOne(id);
  }

  @Get(':id/episodes')
  @ApiOperation({ summary: 'Get program episodes' })
  @ApiResponse({
    status: 200,
    description: 'Successful retrieval of program episodes.',
  })
  @ApiResponse({ status: 404, description: 'Program not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getProgramEpisodes(@Param('id', ParseUUIDPipe) id: string) {
    return this.programsService.getProgramWithEpisodes(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update program' })
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Program not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) body: UpdateProgramDto,
  ) {
    return this.programsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete program' })
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Program not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.programsService.remove(id);
  }

  @Put(':id/publish')
  @ApiOperation({
    summary: 'Publish a program',
    description: 'Publish a program to make it available in Discovery service',
  })
  @ApiResponse({ status: 200, description: 'Program published successfully' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async publishProgram(@Param('id', ParseUUIDPipe) id: string) {
    return await this.programsService.publish(id);
  }

  @Put(':id/unpublish')
  @ApiOperation({
    summary: 'Unpublish a program',
    description: 'Unpublish a program to remove it from Discovery service',
  })
  @ApiResponse({ status: 200, description: 'Program unpublished successfully' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async unpublishProgram(@Param('id', ParseUUIDPipe) id: string) {
    return await this.programsService.unpublish(id);
  }
}
