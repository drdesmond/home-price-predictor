import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prediction } from './prediction.entity';
import { PredictionController } from './prediction.controller';
import { PredictionService } from './prediction.service';

@Module({
  imports: [TypeOrmModule.forFeature([Prediction])],
  controllers: [PredictionController],
  providers: [PredictionService],
})
export class PredictionModule {}
