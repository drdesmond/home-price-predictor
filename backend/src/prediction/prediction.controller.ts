import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { FindPredictionsQueryDto } from './dto/find-predictions-query.dto';
import {
  PredictionCollectionResponseDto,
  PredictionResponseDto,
} from './dto/prediction-response.dto';
import { PredictionService } from './prediction.service';

const DEFAULT_PREDICTION_LIMIT = 100;

@Controller('predictions')
export class PredictionController {
  private readonly logger = new Logger(PredictionController.name);

  constructor(private readonly predictionService: PredictionService) {}

  @Post()
  async create(
    @Body() createPredictionDto: CreatePredictionDto,
  ): Promise<PredictionResponseDto> {
    const { square_footage, bedrooms } = createPredictionDto;

    try {
      const persistedPrediction = await this.predictionService.predictAndStore({
        square_footage,
        bedrooms,
      });

      return PredictionResponseDto.fromPrediction(persistedPrediction);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof Error) {
        this.logger.error('Failed to create prediction', error.stack);
        throw new HttpException(
          error.message ?? 'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.error('Failed to create prediction due to unknown error');
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll(
    @Query() query: FindPredictionsQueryDto,
  ): Promise<PredictionCollectionResponseDto> {
    const limit = query.limit ?? DEFAULT_PREDICTION_LIMIT;
    const predictions = await this.predictionService.findAll(limit);
    const count = await this.predictionService.count();

    return new PredictionCollectionResponseDto({
      count,
      predictions: predictions.map((prediction) =>
        PredictionResponseDto.fromPrediction(prediction),
      ),
    });
  }
}
