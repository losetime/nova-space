import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export type FeedbackType = 'bug' | 'feature' | 'suggestion' | 'other';

export class CreateFeedbackDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsEnum(['bug', 'feature', 'suggestion', 'other'])
  type: FeedbackType;

  @IsNotEmpty({ message: '标题不能为空' })
  @IsString()
  @MaxLength(200)
  title: string;

  @IsNotEmpty({ message: '内容不能为空' })
  @IsString()
  content: string;
}