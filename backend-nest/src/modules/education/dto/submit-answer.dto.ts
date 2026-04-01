import { IsInt, Min, Max } from 'class-validator';

export class SubmitAnswerDto {
  @IsInt()
  quizId: number;

  @IsInt()
  @Min(0)
  @Max(3)
  selectedIndex: number;
}
