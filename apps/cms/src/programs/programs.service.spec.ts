import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { Program, ProgramStatus, ProgramType } from './programs.entity';

describe('ProgramsService', () => {
  let service: ProgramsService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramsService,
        {
          provide: getRepositoryToken(Program),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProgramsService>(ProgramsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a program successfully', async () => {
      const programData = {
        title: 'Test Program',
        description: 'Test Description',
        category: 'Test Category',
        language: 'English',
      };

      const savedProgram = {
        id: '123',
        ...programData,
        status: ProgramStatus.DRAFT,
        type: ProgramType.PODCAST,
      };

      mockRepository.create.mockReturnValue(savedProgram);
      mockRepository.save.mockResolvedValue(savedProgram);

      const result = await service.create(programData);

      expect(mockRepository.create).toHaveBeenCalledWith(programData);
      expect(mockRepository.save).toHaveBeenCalledWith(savedProgram);
      expect(result).toEqual(savedProgram);
    });

    it('should throw BadRequestException when required fields are missing', async () => {
      const incompleteData = {
        title: 'Test Program',
        // missing description, category, language
      };

      await expect(service.create(incompleteData)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a program when found', async () => {
      const programId = '123';
      const program = {
        id: programId,
        title: 'Test Program',
        description: 'Test Description',
      };

      mockRepository.findOne.mockResolvedValue(program);

      const result = await service.findOne(programId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: programId },
        relations: ['episodes', 'publisher'],
      });
      expect(result).toEqual(program);
    });

    it('should throw NotFoundException when program not found', async () => {
      const programId = '999';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(programId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
