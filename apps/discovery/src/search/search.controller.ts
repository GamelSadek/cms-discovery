import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Search content',
    description: 'Search for programs and episodes with various filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results returned successfully',
  })
  async search(@Query() searchQuery: SearchQueryDto) {
    return this.searchService.search(searchQuery);
  }

  @Get('popular')
  @ApiOperation({
    summary: 'Get popular content',
    description: 'Get most popular programs and episodes',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Popular content returned successfully',
  })
  async getPopular(@Query('limit') limit?: number) {
    return this.searchService.getPopularContent(limit || 10);
  }

  @Get('recent')
  @ApiOperation({
    summary: 'Get recent content',
    description: 'Get most recently published programs and episodes',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent content returned successfully',
  })
  async getRecent(@Query('limit') limit?: number) {
    return this.searchService.getRecentContent(limit || 10);
  }
}
