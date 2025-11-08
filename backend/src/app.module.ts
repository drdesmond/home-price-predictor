import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictionModule } from './prediction/prediction.module';
import { Prediction } from './prediction/prediction.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'predictions.db',
      entities: [Prediction],
      synchronize: true, // Only for development
    }),
    PredictionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
