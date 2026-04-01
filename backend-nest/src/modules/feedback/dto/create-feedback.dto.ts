import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { FeedbackType } from '../entities/feedback.entity';

export class CreateFeedbackDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsEnum(FeedbackType)
  type: FeedbackType;

  @IsNotEmpty({ message: '标题不能为空' })
  @IsString()
  @MaxLength(200)
  title: string;

  @IsNotEmpty({ message: '内容不能为空' })
  @IsString()
  content: string;
}
