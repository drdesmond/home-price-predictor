import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class CreatePredictionDto {
  @Type(() => Number)
  @IsNotEmpty()
  @IsPositive()
  square_footage: number;

  @Type(() => Number)
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  bedrooms: number;
}
