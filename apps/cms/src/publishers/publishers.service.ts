import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Publisher } from './publishers.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PublishersService {
  constructor(
    @InjectRepository(Publisher)
    private readonly repo: Repository<Publisher>,
  ) {}

  async create(email: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    const publisher = this.repo.create({ email, password: hashed });
    return this.repo.save(publisher);
  }

  async findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  async getProfile(id: string) {
    const publisher = await this.repo.findOne({ where: { id } });
    if (!publisher) {
      throw new NotFoundException(`Publisher with id ${id} not found`);
    }
    return {
      id: publisher.id,
      email: publisher.email,
      createdAt: publisher.createdAt,
    };
  }

  async updateProfile(id: string, data: { email?: string }) {
    const publisher = await this.repo.findOne({ where: { id } });
    if (!publisher) {
      throw new NotFoundException(`Publisher with id ${id} not found`);
    }

    if (data.email && data.email !== publisher.email) {
      const existingPublisher = await this.findByEmail(data.email);
      if (existingPublisher) {
        throw new ConflictException('Email already in use');
      }
    }

    await this.repo.update(id, data);
    return this.getProfile(id);
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    if (!currentPassword || !newPassword) {
      throw new BadRequestException(
        'Current password and new password are required',
      );
    }

    if (newPassword.length < 6) {
      throw new BadRequestException(
        'New password must be at least 6 characters long',
      );
    }

    const publisher = await this.repo.findOne({ where: { id } });
    if (!publisher) {
      throw new NotFoundException(`Publisher with id ${id} not found`);
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      publisher.password,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.repo.update(id, { password: hashedNewPassword });

    return { message: 'Password changed successfully' };
  }

  async deleteAccount(id: string) {
    const publisher = await this.repo.findOne({ where: { id } });
    if (!publisher) {
      throw new NotFoundException(`Publisher with id ${id} not found`);
    }

    await this.repo.delete(id);
    return { message: 'Account deleted successfully' };
  }

  async validate(email: string, password: string): Promise<Publisher | null> {
    const user = await this.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }
}
