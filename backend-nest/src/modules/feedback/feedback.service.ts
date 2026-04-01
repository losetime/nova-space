import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
  ) {}

  async create(createFeedbackDto: CreateFeedbackDto): Promise<Feedback> {
    const feedback = this.feedbackRepository.create(createFeedbackDto);
    return this.feedbackRepository.save(feedback);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Feedback[]; total: number }> {
    const [data, total] = await this.feedbackRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findOne(id: string): Promise<Feedback | null> {
    return this.feedbackRepository.findOne({ where: { id } });
  }

  async updateStatus(id: string, status: string): Promise<Feedback | null> {
    await this.feedbackRepository.update(id, { status: status as any });
    return this.findOne(id);
  }
}
