import { Prediction } from '../prediction.entity';

export class PredictionResponseDto {
  constructor(prediction: Prediction) {
    this.id = prediction.id;
    this.square_footage = prediction.square_footage;
    this.bedrooms = prediction.bedrooms;
    this.predicted_price = prediction.predicted_price;
    this.created_at = prediction.created_at;
  }

  readonly id: number;
  readonly square_footage: number;
  readonly bedrooms: number;
  readonly predicted_price: number;
  readonly created_at: Date;

  static fromPrediction(prediction: Prediction): PredictionResponseDto {
    return new PredictionResponseDto(prediction);
  }
}

export class PredictionCollectionResponseDto {
  constructor(args: { count: number; predictions: PredictionResponseDto[] }) {
    this.count = args.count;
    this.predictions = args.predictions;
  }

  readonly count: number;
  readonly predictions: PredictionResponseDto[];
}
